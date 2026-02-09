import EventEmitter from 'events';

import type { CloudinaryUploadResult } from './core/CloudinaryUploadResult';
import { UploadError, ValidationError } from './core/Errors';
import type { Logger } from './core/Logger';
import { defaultLogger } from './core/Logger';
import { sleep } from './core/Utils';
import type { FileMeta, ValidationPolicy } from './core/ValidationPolicy';
import type { CloudinaryConfig, CloudinaryUploadOptions } from './providers/CloudinaryProvider';
import { CloudinaryProvider } from './providers/CloudinaryProvider';
import type { Scanner } from './scanner/Scanner';
import { MultipartService } from './services/MultipartService';
import { PresignedUrlService } from './services/PresignedUrlService';
import { Validator } from './validation/Validator';

export class CloudinaryUploader extends EventEmitter {
  private validator: Validator;
  private provider: CloudinaryProvider;
  private multipart: MultipartService;
  private presigned: PresignedUrlService;
  private scanner?: Scanner;
  private maxRetries: number;

  constructor(config: {
    cloudinaryConfig: CloudinaryConfig;
    defaultPolicy?: ValidationPolicy;
    profiles?: Record<string, ValidationPolicy>;
    maxRetries?: number;
    scanner?: Scanner;
    logger?: Logger | (() => Logger);
    basePath?: string;
  }) {
    super();

    this.validator = new Validator(config.defaultPolicy, config.profiles);

    const loggerInstance = config.logger
      ? typeof config.logger === 'function'
        ? config.logger()
        : config.logger
      : defaultLogger;

    this.provider = new CloudinaryProvider(config.cloudinaryConfig, loggerInstance as Logger);
    this.multipart = new MultipartService(this.provider);
    this.presigned = new PresignedUrlService(this.provider);
    this.scanner = config.scanner;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Upload un fichier sur Cloudinary
   */
  async uploadFile(
    file: Buffer | string,
    metadata: FileMeta,
    options?: {
      policy?: string;
      folder?: string;
      transformation?: any;
      resourceType?: 'image' | 'video' | 'auto';
      filename?: string;
    },
  ): Promise<CloudinaryUploadResult> {
    const startTime = Date.now();
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        this.emit('uploadStart', { file: metadata.filename, attempt: attempt + 1 });

        // Validation du fichier
        const validationResult = await this.validator.validate(metadata, options?.policy);

        if (validationResult === true) {
          // Validation réussie
        } else {
          throw new ValidationError(validationResult.errors?.join(', ') || 'Validation failed');
        }

        // Scanning antivirus si configuré
        if (this.scanner) {
          this.emit('scanStart', { file: metadata.filename });
          const scanResult = await this.scanner.scan(
            file instanceof Buffer ? file : Buffer.from(file),
            metadata.filename,
          );

          if (!scanResult.ok) {
            throw new UploadError('file_infected', scanResult.reason);
          }

          this.emit('scanComplete', { file: metadata.filename, clean: true });
        }

        // Préparation des options Cloudinary
        const cloudinaryOptions: CloudinaryUploadOptions = {
          folder: options?.folder || 'uploads',
          resource_type: options?.resourceType || 'auto',
          transformation: options?.transformation,
        };

        if (options?.filename) {
          cloudinaryOptions.public_id = `${cloudinaryOptions.folder}/${options.filename}`;
        }

        // Upload sur Cloudinary
        const result = await this.provider.putObject(
          metadata.filename,
          file,
          metadata.size,
          metadata.contentType,
          cloudinaryOptions,
        );

        const uploadResult: CloudinaryUploadResult = {
          success: true,
          url: result.url,
          key: result.publicId,
          size: result.bytes,
          contentType: result.resourceType,
          metadata: {
            publicId: result.publicId,
            format: result.format,
            width: result.width?.toString(),
            height: result.height?.toString(),
            resourceType: result.resourceType,
            createdAt: result.createdAt.toISOString(),
          },
          uploadTime: Date.now() - startTime,
        };

        this.emit('uploadComplete', {
          file: metadata.filename,
          result: uploadResult,
          attempt: attempt + 1,
        });

        return uploadResult;
      } catch (error: any) {
        attempt++;
        const isLastAttempt = attempt >= this.maxRetries;

        this.emit('uploadError', {
          file: metadata.filename,
          error: error.message || error,
          attempt,
          isLastAttempt,
        });

        if (isLastAttempt) {
          throw error;
        }

        // Attendre avant de réessayer
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new UploadError('max_retries_exceeded', 'Maximum retry attempts exceeded');
  }

  /**
   * Upload multiple fichiers
   */
  async uploadMultiple(
    files: Array<{ file: Buffer | string; metadata: FileMeta }>,
    options?: {
      policy?: string;
      folder?: string;
      transformation?: any;
      resourceType?: 'image' | 'video' | 'auto';
      concurrency?: number;
    },
  ): Promise<CloudinaryUploadResult[]> {
    return this.multipart.uploadMultiple(files, {
      ...options,
      uploader: this.uploadFile.bind(this),
    });
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await this.provider.remove(publicId);
      this.emit('deleteComplete', { publicId, result });
      return result.result === 'ok';
    } catch (error: any) {
      this.emit('deleteError', { publicId, error: error.message || error });
      throw error;
    }
  }

  /**
   * Supprime plusieurs fichiers
   */
  async deleteMultiple(publicIds: string[]): Promise<boolean[]> {
    try {
      const results = await this.provider.removeMultiple(publicIds);
      this.emit('deleteMultipleComplete', { count: publicIds.length, results });
      return results.map((r) => r.result === 'ok');
    } catch (error: any) {
      this.emit('deleteMultipleError', {
        count: publicIds.length,
        error: error.message || error,
      });
      throw error;
    }
  }

  /**
   * Génère une URL optimisée
   */
  getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      crop?: 'scale' | 'fill' | 'fit' | 'limit';
      format?: 'webp' | 'avif' | 'auto';
    },
  ): string {
    return this.provider.getOptimizedUrl(publicId, options);
  }

  /**
   * Génère une URL signée pour upload
   */
  async getPresignedUploadUrl(filename: string, expiresInSeconds: number = 3600): Promise<string> {
    return this.presigned.getPresignedUploadUrl(filename, expiresInSeconds);
  }

  /**
   * Récupère les informations d'une ressource
   */
  async getResourceInfo(publicId: string): Promise<any> {
    return this.provider.getResourceInfo(publicId);
  }

  /**
   * Vérifie si Cloudinary est configuré
   */
  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /**
   * Initialise le provider (compatibilité d'interface)
   */
  async initialize(): Promise<void> {
    await this.provider.ensureBucketExists();
    this.emit('initialized');
  }

  /**
   * Nettoyage des ressources
   */
  async cleanup(): Promise<void> {
    this.removeAllListeners();
    this.emit('cleanup');
  }
}
