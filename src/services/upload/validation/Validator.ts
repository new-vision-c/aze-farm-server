import { lookup as mimeLookup } from 'mime-types';

import { ValidationError } from '../core/Errors';
import { extFromFilename } from '../core/Utils';
import type { FileMeta, ValidationPolicy } from '../core/ValidationPolicy';

export class Validator {
  constructor(
    private defaultPolicy?: ValidationPolicy,
    private profiles: Record<string, ValidationPolicy> = {},
  ) {}

  private getPolicy(profile?: string): ValidationPolicy | undefined {
    if (profile && this.profiles[profile])
      return { ...this.defaultPolicy, ...this.profiles[profile] };
    return this.defaultPolicy;
  }

  validate(meta: FileMeta, profile?: string): true | { valid: false; errors?: string[] } {
    try {
      this.validateStrict(meta, profile);
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        return { valid: false, errors: [error.message] };
      }
      throw error;
    }
  }

  private validateStrict(meta: FileMeta, profile?: string): true {
    const policy = this.getPolicy(profile);

    if (!policy) {
      return true; // Pas de politique de validation = accepter par défaut
    }

    const ext = extFromFilename(meta.filename);
    const detectedMime =
      meta.contentType || mimeLookup(meta.filename) || 'application/octet-stream';

    if (policy.maxSizeBytes && meta.size && meta.size > policy.maxSizeBytes) {
      throw new ValidationError('file_too_large', { max: policy.maxSizeBytes, actual: meta.size });
    }

    if (policy.allowedMimeTypes && policy.allowedMimeTypes.length > 0) {
      if (!policy.allowedMimeTypes.includes(detectedMime)) {
        throw new ValidationError('mime_not_allowed', { detectedMime });
      }
    }

    if (policy.allowedExtensions && policy.allowedExtensions.length > 0) {
      if (!policy.allowedExtensions.includes(ext)) {
        throw new ValidationError('extension_not_allowed', { ext });
      }
    }

    return true;
  }
}
