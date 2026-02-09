import type { Readable } from 'stream';

import type { CloudinaryUploadResult } from '../core/CloudinaryUploadResult';
import { UploadError } from '../core/Errors';
import type { FileMeta } from '../core/ValidationPolicy';

export class MultipartService {
  constructor(private provider: any) {}

  async uploadMultiple(
    files: Array<{ file: Buffer | string; metadata: FileMeta }>,
    options: {
      policy?: string;
      folder?: string;
      transformation?: any;
      resourceType?: 'image' | 'video' | 'auto';
      concurrency?: number;
      uploader: (
        file: Buffer | string,
        metadata: FileMeta,
        options?: any,
      ) => Promise<CloudinaryUploadResult>;
    },
  ): Promise<CloudinaryUploadResult[]> {
    const concurrency = options.concurrency || 3;
    const results: CloudinaryUploadResult[] = [];

    // Traitement par lots pour gérer la concurrence
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);

      const batchPromises = batch.map(({ file, metadata }) =>
        this.uploadSingleFile(file, metadata, options, options.uploader),
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            // Créer un résultat d'erreur pour ce fichier
            const errorResult: CloudinaryUploadResult = {
              success: false,
              error: result.reason instanceof Error ? result.reason.message : 'Upload failed',
              url: '',
              key: batch[index].metadata.filename,
              size: batch[index].metadata.size || 0,
              contentType: batch[index].metadata.contentType || 'application/octet-stream',
              uploadTime: 0,
            };
            results.push(errorResult);
          }
        });
      } catch (error) {
        // Erreur au niveau du batch
        throw new UploadError('batch_upload_failed', error);
      }
    }

    return results;
  }

  private async uploadSingleFile(
    file: Buffer | string,
    metadata: FileMeta,
    options: any,
    uploader: (
      file: Buffer | string,
      metadata: FileMeta,
      options?: any,
    ) => Promise<CloudinaryUploadResult>,
  ): Promise<CloudinaryUploadResult> {
    return uploader(file, metadata, options);
  }

  // Méthodes S3/MinIO conservées pour compatibilité
  async createMultipartUpload(key: string, contentType?: string): Promise<string> {
    if (typeof this.provider.createMultipartUpload === 'function') {
      const res = await this.provider.createMultipartUpload({
        Bucket: this.provider.bucket,
        Key: key,
        ContentType: contentType,
      });
      const uploadId = res.UploadId || res.uploadId;
      if (!uploadId) throw new UploadError('create_multipart_failed', res);
      return uploadId;
    }
    throw new UploadError('create_multipart_not_supported_by_client');
  }

  async uploadPart(key: string, uploadId: string, partNumber: number, body: Buffer | Readable) {
    if (typeof this.provider.uploadPart === 'function') {
      const res = await this.provider.uploadPart({
        Bucket: this.provider.bucket,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: body,
      });
      return { ETag: res.ETag, PartNumber: partNumber };
    }
    throw new UploadError('upload_part_not_supported_by_client');
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>,
  ) {
    if (typeof this.provider.completeMultipartUpload === 'function') {
      return this.provider.completeMultipartUpload({
        Bucket: this.provider.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      });
    }
    throw new UploadError('complete_multipart_not_supported_by_client');
  }

  async abortMultipartUpload(key: string, uploadId: string) {
    if (typeof this.provider.abortMultipartUpload === 'function') {
      return this.provider.abortMultipartUpload({
        Bucket: this.provider.bucket,
        Key: key,
        UploadId: uploadId,
      });
    }
    throw new UploadError('abort_multipart_not_supported_by_client');
  }
}
