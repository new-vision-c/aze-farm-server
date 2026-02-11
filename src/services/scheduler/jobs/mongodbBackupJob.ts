import { exec } from 'child_process';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import fs from 'fs-extra';
import { MongoClient } from 'mongodb';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

import log from '@/services/logging/logger';
import type { Uploader } from '@/services/upload/core/Uploader';

import { scheduler } from '..';
import { schedulerConfig } from '../_config';
import backupConfig from '../_config/backup';
import { getCurrentDatePath, getOldBackupDates } from '../_utils/dateUtils';
import type { NotificationService } from '../notifications/backup.notifications';

const execAsync = promisify(exec);

export class MongodbBackupJob {
  private isRunning = false;
  private task: any = null;
  private uploader?: Uploader;
  private notificationService?: NotificationService;

  constructor(dependencies?: { uploader?: Uploader; notificationService?: NotificationService }) {
    if (dependencies) {
      this.uploader = dependencies.uploader;
      this.notificationService = dependencies.notificationService;
    }
  }

  // Set uploader (can be called after construction if needed)
  setUploader(uploader: Uploader) {
    this.uploader = uploader;
  }

  // Set notification service (can be called after construction if needed)
  setNotificationService(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  async execute(): Promise<void> {
    if (!this.uploader) {
      log.error('Uploader is not available. Cannot execute backup job.');
      return;
    }

    if (this.isRunning) {
      log.warn('Une sauvegarde est déjà en cours, annulation...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const backupId = uuidv4();
    const datePath = getCurrentDatePath();
    const timestamp = format(toZonedTime(new Date(), backupConfig.timezone), 'HH-mm-ss');
    const backupDir = path.join(backupConfig.mongo.dumpPath, backupId);
    const archiveName = `mongodb-${datePath}-${timestamp}.tar.gz`;
    const archivePath = path.join('/tmp', archiveName);

    try {
      log.info(`Début de la sauvegarde MongoDB (ID: ${backupId})`);

      // Créer le répertoire de sauvegarde
      await fs.ensureDir(backupDir);

      // Exécuter mongodump
      await this.runMongoDump(backupDir);

      // Créer une archive compressée
      await this.createBackupArchive(backupDir, archivePath);

      // Téléverser vers le stockage
      const objectName = `mongodb/${datePath}/${backupConfig.mongo.dbName}/${archiveName}`;

      const fileContent = await fs.readFile(archivePath);
      // Envoyer les métadonnées dans le nom du fichier avec un format spécifique
      const metadataString = `backup-type=mongodb;db=${backupConfig.mongo.dbName};created=${new Date().toISOString()}`;
      const filenameWithMetadata = `${path.basename(objectName, '.tar.gz')}_meta_${Buffer.from(metadataString).toString('base64')}.tar.gz`;

      await this.uploader.uploadBuffer(
        fileContent,
        {
          filename: filenameWithMetadata,
          contentType: 'application/gzip',
          size: fileContent.length,
        },
        {
          prefix: path.dirname(objectName),
        },
      );

      // Nettoyer les anciennes sauvegardes
      await this.cleanupOldBackups();

      // Envoyer une notification de succès
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const fileSize = (await fs.stat(archivePath)).size;
      const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

      if (this.notificationService) {
        try {
          await this.notificationService.sendBackupSuccess({
            backupPath: objectName,
            size: `${sizeInMB} MB`,
            duration: `${duration} secondes`,
          });
        } catch (error) {
          log.error('Failed to send backup success notification:', error);
        }
      }

      log.info(`Sauvegarde terminée avec succès en ${duration} secondes`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      
      log.error('Erreur lors de la sauvegarde MongoDB:', {
        message: errorMsg,
        stack: errorStack,
        timestamp: new Date().toISOString(),
        backupId,
      });

      // Envoyer une notification d'erreur
      if (this.notificationService) {
        try {
          await this.notificationService.sendBackupError(
            new Error(`MongoDB Backup Failed: ${errorMsg}`)
          );
        } catch (notifError) {
          const notifMsg = notifError instanceof Error ? notifError.message : String(notifError);
          log.error('Failed to send backup error notification:', {
            message: notifMsg,
            originalError: errorMsg,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } finally {
      // Nettoyage
      await fs
        .remove(backupDir)
        .catch((err) => log.error('Erreur lors du nettoyage du dossier temporaire:', err));
      await fs
        .remove(archivePath)
        .catch((err) => log.error("Erreur lors de la suppression de l'archive temporaire:", err));
      this.isRunning = false;
    }
  }

  private async runMongoDump(outputDir: string): Promise<void> {
    try {
      // Options optimisées pour la connexion MongoDB
      const mongoOptions = {
        tls: true,
        retryWrites: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000, // Augmenté pour les longues opérations
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      };

      const client = new MongoClient(backupConfig.mongo.uri, mongoOptions);
      
      try {
        await client.connect();
        const db = client.db(backupConfig.mongo.dbName);

        log.debug('Connexion à MongoDB établie');

      // Si des collections spécifiques sont configurées, les sauvegarder individuellement
      if (backupConfig.mongo.collections.length > 0) {
        for (const collectionName of backupConfig.mongo.collections) {
          const collection = db.collection(collectionName);
          const documents = await collection.find({}).toArray();

          const collectionPath = path.join(outputDir, backupConfig.mongo.dbName, collectionName);
          await fs.ensureDir(collectionPath);

          // Sauvegarder les documents dans un fichier JSON
          const filePath = path.join(collectionPath, 'documents.json');
          await fs.writeJson(filePath, documents, { spaces: 2 });

          log.debug(`Collection ${collectionName} sauvegardée: ${documents.length} documents`);
        }
      } else {
        // Sauvegarder toutes les collections
        const collections = await db.listCollections().toArray();

        for (const collectionInfo of collections) {
          const collectionName = collectionInfo.name;
          const collection = db.collection(collectionName);
          const documents = await collection.find({}).toArray();

          const collectionPath = path.join(outputDir, backupConfig.mongo.dbName, collectionName);
          await fs.ensureDir(collectionPath);

          // Sauvegarder les documents dans un fichier JSON
          const filePath = path.join(collectionPath, 'documents.json');
          await fs.writeJson(filePath, documents, { spaces: 2 });

          log.debug(`Collection ${collectionName} sauvegardée: ${documents.length} documents`);
        }
      }

      await client.close();
      log.debug('Sauvegarde MongoDB terminée avec succès');
      } catch (connectionError) {
        throw new Error(`Erreur de connexion MongoDB: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`);
      } finally {
        try {
          await client.close();
        } catch (closeError) {
          log.warn('Erreur lors de la fermeture de la connexion MongoDB:', closeError);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Échec de la sauvegarde MongoDB: ${errorMsg}`);
    }
  }

  private async createBackupArchive(sourceDir: string, outputPath: string): Promise<void> {
    try {
      const tarCommand = `tar -czf ${outputPath} -C ${path.dirname(sourceDir)} ${path.basename(sourceDir)}`;
      await execAsync(tarCommand);
      log.debug(`Archive créée: ${outputPath}`);
    } catch (error) {
      throw new Error(`Échec de la création de l'archive: ${error}`);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const oldBackupDates = getOldBackupDates(backupConfig.retentionDays);

      for (const date of oldBackupDates) {
        const prefix = `mongodb/${date}/`;
        // Implémentez la logique de suppression avec storageService
        // Cela dépend de l'implémentation de votre storageService
      }
    } catch (error) {
      log.error('Erreur lors du nettoyage des anciennes sauvegardes:', error);
    }
  }

  start(): void {
    if (!this.uploader) {
      log.warn('Uploader is not available. MongoDB backup job will not start.');
      return;
    }

    if (this.task) {
      this.task.stop();
    }

    const { schedule: cronSchedule, options } = schedulerConfig.backupJob;
    this.task = scheduler.schedule(cronSchedule, this.execute.bind(this), options);
    log.info('********************MongoDB Backup Job started********************');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
    }
    log.info('Arrêt du job de sauvegarde MongoDB');
  }
}
