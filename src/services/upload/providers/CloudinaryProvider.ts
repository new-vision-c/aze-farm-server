import { type UploadApiResponse, v2 as cloudinary } from 'cloudinary';

import { UploadError } from '../core/Errors';
import type { Logger } from '../core/Logger';

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure?: boolean;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'auto';
  use_filename?: boolean;
  unique_filename?: boolean;
  overwrite?: boolean;
  public_id?: string;
  transformation?: any;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
  createdAt: Date;
}

export class CloudinaryProvider {
  constructor(
    private config: CloudinaryConfig,
    private logger: Logger,
  ) {
    // Configuration de Cloudinary
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
      secure: config.secure ?? true,
    });
  }

  async putObject(
    key: string,
    data: Buffer | string,
    size?: number,
    contentType?: string,
    options?: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    try {
      this.logger.info("Tentative d'upload sur Cloudinary", {
        key,
        size,
        contentType,
        folder: options?.folder,
      });

      const uploadOptions: any = {
        folder: options?.folder || 'uploads',
        resource_type: options?.resource_type || 'auto',
        use_filename: options?.use_filename ?? true,
        unique_filename: options?.unique_filename ?? true,
        overwrite: options?.overwrite ?? true,
      };

      // Ajouter le public_id personnalisé si fourni
      if (options?.public_id) {
        uploadOptions.public_id = options.public_id;
      }

      // Ajouter les transformations si fournies
      if (options?.transformation) {
        uploadOptions.transformation = options.transformation;
      }

      let result: UploadApiResponse;

      if (typeof data === 'string') {
        // Upload depuis un chemin de fichier
        result = await cloudinary.uploader.upload(data, uploadOptions);
      } else {
        // Upload depuis un buffer
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: any, result: any) => {
              if (error) {
                reject(new Error(`Erreur upload Cloudinary: ${error.message}`));
              } else if (result) {
                resolve(result);
              } else {
                reject(new Error("Résultat d'upload Cloudinary invalide"));
              }
            },
          );

          // Écrire le buffer dans le stream
          uploadStream.end(data);
        });
      }

      const uploadResult: CloudinaryUploadResult = {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type,
        createdAt: new Date(result.created_at),
      };

      this.logger.info('Upload réussi sur Cloudinary', {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        size: uploadResult.bytes,
      });

      return uploadResult;
    } catch (err: any) {
      this.logger.error("Échec de l'upload sur Cloudinary", {
        key,
        error: err.message || err,
        stack: err.stack,
      });
      throw new UploadError('cloudinary_upload_failed', err);
    }
  }

  async remove(
    publicId: string,
  ): Promise<{ result: 'ok' | 'not found' | 'error'; publicId?: string }> {
    try {
      this.logger.info('Tentative de suppression sur Cloudinary', { publicId });

      const result = await cloudinary.uploader.destroy(publicId);

      this.logger.info('Suppression Cloudinary terminée', {
        publicId,
        result: result.result,
      });

      return {
        result: result.result as 'ok' | 'not found' | 'error',
        publicId: result.public_id,
      };
    } catch (err: any) {
      this.logger.error('Échec de la suppression sur Cloudinary', {
        publicId,
        error: err.message || err,
        stack: err.stack,
      });
      throw new UploadError('cloudinary_delete_failed', err);
    }
  }

  async removeMultiple(
    publicIds: string[],
  ): Promise<{ result: 'ok' | 'not found' | 'error'; publicId?: string }[]> {
    try {
      this.logger.info('Tentative de suppression multiple sur Cloudinary', {
        count: publicIds.length,
      });

      const _results = await cloudinary.api.delete_resources(publicIds);

      const deleteResults = publicIds.map((publicId: string, _index: number) => ({
        result: 'ok' as const,
        publicId,
      }));

      this.logger.info('Suppression multiple Cloudinary terminée', {
        count: deleteResults.length,
      });

      return deleteResults;
    } catch (err: any) {
      this.logger.error('Échec de la suppression multiple sur Cloudinary', {
        count: publicIds.length,
        error: err.message || err,
        stack: err.stack,
      });
      throw new UploadError('cloudinary_delete_multiple_failed', err);
    }
  }

  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      crop?: 'scale' | 'fill' | 'fit' | 'limit';
      format?: 'webp' | 'avif' | 'auto';
    } = {},
  ): string {
    const transformations: string[] = [];

    if (options.width || options.height) {
      const w = options.width || '';
      const h = options.height || '';
      const crop = options.crop || 'scale';
      transformations.push(`c_${crop},w_${w},h_${h}`);
    }

    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    const transformationString = transformations.length > 0 ? transformations.join(',') : '';

    return cloudinary.url(publicId, {
      transformation: transformationString,
      secure: true,
    });
  }

  async getResourceInfo(publicId: string): Promise<any> {
    try {
      this.logger.info('Récupération infos ressource Cloudinary', { publicId });

      const result = await cloudinary.api.resource(publicId);

      this.logger.info('Infos ressource récupérées', { publicId });

      return result;
    } catch (err: any) {
      this.logger.error('Échec récupération infos ressource', {
        publicId,
        error: err.message || err,
        stack: err.stack,
      });
      throw new UploadError('cloudinary_resource_info_failed', err);
    }
  }

  isConfigured(): boolean {
    return !!(this.config.cloud_name && this.config.api_key && this.config.api_secret);
  }

  async ensureBucketExists(): Promise<void> {
    // Cloudinary n'a pas de buckets comme MinIO/S3
    // Cette méthode est implémentée pour la compatibilité d'interface
    this.logger.info('Cloudinary ne nécessite pas de création de bucket');
  }

  async list(_prefix?: string): Promise<any[]> {
    // Cloudinary n'a pas de listing natif comme MinIO/S3
    // Cette méthode pourrait implémenter l'API resources si nécessaire
    this.logger.warn('Listage non implémenté pour Cloudinary');
    return [];
  }

  async presignedPutUrl(key: string, _expiresSeconds: number): Promise<string> {
    // Cloudinary peut générer des URLs signées pour l'upload
    try {
      const timestamp = Math.round(Date.now() / 1000) + _expiresSeconds;
      const signature = cloudinary.utils.api_sign_request(
        {
          public_id: key,
          timestamp,
        },
        this.config.api_secret,
      );

      const url = `https://api.cloudinary.com/v1_1/${this.config.cloud_name}/image/upload`;
      return `${url}?api_key=${this.config.api_key}&timestamp=${timestamp}&signature=${signature}&public_id=${key}`;
    } catch (err: any) {
      this.logger.error('Échec génération URL signée', {
        key,
        error: err.message || err,
      });
      throw new UploadError('cloudinary_presigned_url_failed', err);
    }
  }

  async presignedGetUrl(key: string, _expiresSeconds: number): Promise<string> {
    // Retourne l'URL directe (Cloudinary URLs sont déjà publiques)
    try {
      const resource = await cloudinary.api.resource(key);
      return resource.secure_url;
    } catch (err: any) {
      this.logger.error('Échec génération URL accès', {
        key,
        error: err.message || err,
      });
      throw new UploadError('cloudinary_get_url_failed', err);
    }
  }
}
