import { lookup as mimeLookup } from 'mime-types';

import { CloudinaryUploader } from '../../../services/upload/CloudinaryUploader';
import { extFromFilename } from '../../../services/upload/core/Utils';
import type { FileMeta } from '../../../services/upload/core/ValidationPolicy';
import { conversationI18n } from './ConversationI18nService';

/**
 * Types de données non structurées supportées dans les conversations
 */
export type UnstructuredDataType = 'image' | 'audio' | 'video' | 'text' | 'document';

/**
 * Métadonnées pour les données non structurées
 */
export interface UnstructuredDataMetadata {
  type: UnstructuredDataType;
  originalName: string;
  size: number;
  mimeType: string;
  url?: string;
  duration?: number; // Pour audio/vidéo
  dimensions?: { width: number; height: number }; // Pour images/vidéo
  transcription?: string; // Pour audio
  extractedText?: string; // Pour images (OCR)
}

/**
 * Résultat du traitement des données non structurées
 */
export interface UnstructuredDataResult {
  success: boolean;
  data?: UnstructuredDataMetadata;
  error?: string;
  processedAt: string;
}

/**
 * Service pour gérer les données non structurées dans les conversations
 * Images, données vocales, texte, documents
 */
export class ConversationUnstructuredDataService {
  private uploader: CloudinaryUploader;
  private maxFileSize: number;
  private allowedTypes: UnstructuredDataType[];

  constructor() {
    // Configuration du service d'upload existant
    this.uploader = new CloudinaryUploader({
      cloudinaryConfig: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
        secure: true,
      },
      defaultPolicy: {
        maxSizeBytes: 50 * 1024 * 1024, // 50MB max
        allowedMimeTypes: [
          // Images
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          // Audio
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'audio/mp4',
          // Vidéo
          'video/mp4',
          'video/webm',
          'video/quicktime',
          // Documents
          'application/pdf',
          'text/plain',
          'text/csv',
        ],
        allowedExtensions: [
          // Images
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          // Audio
          '.mp3',
          '.wav',
          '.ogg',
          '.m4a',
          // Vidéo
          '.mp4',
          '.webm',
          '.mov',
          // Documents
          '.pdf',
          '.txt',
          '.csv',
        ],
      },
      profiles: {
        conversation_image: {
          maxSizeBytes: 10 * 1024 * 1024, // 10MB pour les images de conversation
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        },
        conversation_audio: {
          maxSizeBytes: 25 * 1024 * 1024, // 25MB pour l'audio
          allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
          allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a'],
        },
        conversation_video: {
          maxSizeBytes: 100 * 1024 * 1024, // 100MB pour les vidéos
          allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          allowedExtensions: ['.mp4', '.webm', '.mov'],
        },
      },
    });

    this.maxFileSize = 50 * 1024 * 1024; // 50MB par défaut
    this.allowedTypes = ['image', 'audio', 'video', 'text', 'document'];
  }

  /**
   * Traite un fichier uploadé dans une conversation
   * @param file - Fichier uploadé (Buffer ou string)
   * @param originalName - Nom original du fichier
   * @param userId - ID de l'utilisateur
   * @param conversationId - ID de la conversation
   * @returns Métadonnées traitées
   */
  public async processUnstructuredData(
    file: Buffer | string,
    originalName: string,
    _userId: string,
    conversationId: string,
  ): Promise<UnstructuredDataResult> {
    try {
      // Détection du type de fichier
      const dataType = this.detectDataType(originalName, file);

      if (!this.allowedTypes.includes(dataType)) {
        return {
          success: false,
          error: conversationI18n.translate('validation.errors.invalid_file_type'),
          processedAt: new Date().toISOString(),
        };
      }

      // Validation de la taille
      const fileSize = typeof file === 'string' ? file.length : file.length;
      if (fileSize > this.maxFileSize) {
        return {
          success: false,
          error: conversationI18n.translate('validation.errors.file_too_large'),
          processedAt: new Date().toISOString(),
        };
      }

      // Préparation des métadonnées
      const metadata: FileMeta = {
        filename: `conversation_${conversationId}_${Date.now()}_${originalName}`,
        size: fileSize,
        contentType: this.getMimeType(dataType, originalName),
      };

      // Upload sur Cloudinary avec le profil de conversation approprié
      const uploadResult = await this.uploader.uploadFile(file as Buffer, metadata, {
        policy: `conversation_${dataType}`,
        folder: `conversations/${conversationId}`,
        resourceType: dataType === 'image' ? 'image' : dataType === 'video' ? 'video' : 'auto',
      });

      if (!uploadResult.success || !uploadResult.url) {
        return {
          success: false,
          error:
            uploadResult.error ||
            conversationI18n.translate('message.errors.invalid_attachment_url') ||
            'Upload failed',
          processedAt: new Date().toISOString(),
        };
      }

      // Traitement supplémentaire selon le type
      const processedMetadata = await this.enhanceMetadata(dataType, uploadResult, file);

      return {
        success: true,
        data: {
          type: dataType,
          originalName,
          size: fileSize,
          mimeType: metadata.contentType || 'application/octet-stream',
          url: uploadResult.url,
          ...processedMetadata,
        },
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erreur lors du traitement des données non structurées:', error);
      return {
        success: false,
        error: conversationI18n.translate('message.errors.invalid_attachment_url'),
        processedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Détecte le type de données non structurées
   */
  private detectDataType(filename: string, _file: Buffer | string): UnstructuredDataType {
    const ext = extFromFilename(filename).toLowerCase();
    const mimeType = mimeLookup(filename);

    // Détection par extension
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return 'image';
    }
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
      return 'audio';
    }
    if (['.mp4', '.webm', '.mov'].includes(ext)) {
      return 'video';
    }
    if (['.pdf', '.txt', '.csv'].includes(ext)) {
      return 'document';
    }

    // Détection par MIME type
    if (mimeType && typeof mimeType === 'string' && mimeType.startsWith('image/')) return 'image';
    if (mimeType && typeof mimeType === 'string' && mimeType.startsWith('audio/')) return 'audio';
    if (mimeType && typeof mimeType === 'string' && mimeType.startsWith('video/')) return 'video';
    if (
      mimeType &&
      typeof mimeType === 'string' &&
      (mimeType.startsWith('text/') || mimeType === 'application/pdf')
    )
      return 'document';

    return 'text'; // Par défaut
  }

  /**
   * Obtient le MIME type approprié
   */
  private getMimeType(dataType: UnstructuredDataType, filename: string): string {
    const detectedMime = mimeLookup(filename);
    if (detectedMime) return detectedMime;

    // Fallback par type
    switch (dataType) {
      case 'image':
        return 'image/jpeg';
      case 'audio':
        return 'audio/mpeg';
      case 'video':
        return 'video/mp4';
      case 'document':
        return 'application/pdf';
      default:
        return 'text/plain';
    }
  }

  /**
   * Améliore les métadonnées selon le type de fichier
   */
  private async enhanceMetadata(
    dataType: UnstructuredDataType,
    uploadResult: any,
    _file: Buffer | string,
  ): Promise<Partial<UnstructuredDataMetadata>> {
    const enhanced: Partial<UnstructuredDataMetadata> = {};

    switch (dataType) {
      case 'image':
        // Pour les images, on pourrait extraire les dimensions de Cloudinary
        if (uploadResult.metadata?.width && uploadResult.metadata?.height) {
          enhanced.dimensions = {
            width: parseInt(uploadResult.metadata.width),
            height: parseInt(uploadResult.metadata.height),
          };
        }
        // TODO: OCR pour extraire le texte des images
        break;

      case 'audio':
        // Pour l'audio, on pourrait faire de la transcription
        enhanced.duration = uploadResult.metadata?.duration || 0;
        // TODO: Service de transcription audio
        break;

      case 'video':
        // Pour les vidéos, extraire les dimensions et durée
        if (uploadResult.metadata?.width && uploadResult.metadata?.height) {
          enhanced.dimensions = {
            width: parseInt(uploadResult.metadata.width),
            height: parseInt(uploadResult.metadata.height),
          };
        }
        enhanced.duration = uploadResult.metadata?.duration || 0;
        break;

      case 'document':
        // Pour les documents, extraction de texte si possible
        // TODO: Service d'extraction de texte PDF
        break;

      case 'text':
        // Pour les fichiers texte, extraction directe
        break;
    }

    return enhanced;
  }

  /**
   * Valide un tableau de données non structurées
   */
  public validateUnstructuredDataArray(dataArray: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxItems = 10; // Maximum 10 fichiers par conversation

    if (dataArray.length > maxItems) {
      errors.push(conversationI18n.translate('validation.errors.too_many_files'));
    }

    for (const item of dataArray) {
      if (!item.file || !item.originalName) {
        errors.push(conversationI18n.translate('validation.errors.invalid_attachment_url'));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Génère une URL présignée pour l'upload
   */
  public async generatePresignedUploadUrl(
    filename: string,
    conversationId: string,
    expiresIn: number = 3600,
  ): Promise<{ url: string; fields?: any }> {
    try {
      const key = `conversations/${conversationId}/uploads/${Date.now()}_${filename}`;

      if (this.uploader.isConfigured()) {
        const uploadUrl = await this.uploader.getPresignedUploadUrl(key, expiresIn);
        const fields = {
          'Content-Type': 'application/octet-stream',
          'X-Unique-Upload-Id': key,
        };
        return { url: uploadUrl, fields };
      } else {
        throw new Error('Service de configuration non initialisé');
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'URL présignée:", error);
      throw error;
    }
  }

  /**
   * Supprime un fichier de conversation
   */
  public async deleteConversationFile(publicId: string, _userId: string): Promise<boolean> {
    try {
      // TODO: Vérifier que l'utilisateur a le droit de supprimer ce fichier
      const result = await this.uploader.deleteFile(publicId);
      return result;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier de conversation:', error);
      return false;
    }
  }

  /**
   * Formate les métadonnées pour l'API
   */
  public formatMetadataForResponse(metadata: UnstructuredDataMetadata): UnstructuredDataMetadata {
    return {
      ...metadata,
      // S'assurer que les champs sensibles ne sont pas exposés
      url: metadata.url?.split('?')[0], // Supprimer les paramètres d'URL
    };
  }

  /**
   * Obtient les statistiques d'utilisation pour un utilisateur
   */
  public async getUserUsageStats(_userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<UnstructuredDataType, { count: number; size: number }>;
  }> {
    // TODO: Implémenter les statistiques depuis la base de données
    return {
      totalFiles: 0,
      totalSize: 0,
      byType: {
        image: { count: 0, size: 0 },
        audio: { count: 0, size: 0 },
        video: { count: 0, size: 0 },
        document: { count: 0, size: 0 },
        text: { count: 0, size: 0 },
      },
    };
  }
}
