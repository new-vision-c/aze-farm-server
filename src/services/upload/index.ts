// Point d'entrée principal pour le service d'upload avec Cloudinary
export {
  defaultCloudinaryConfig,
  isCloudinaryConfigured,
  validateCloudinaryConfig,
} from './_config/cloudinary';
export { CloudinaryUploader } from './CloudinaryUploader';
export type { CloudinaryUploadResult } from './core/CloudinaryUploadResult';
export { CloudinaryProvider } from './providers/CloudinaryProvider';
export type {
  CloudinaryConfig,
  CloudinaryUploadOptions,
  CloudinaryUploadResult as ProviderCloudinaryUploadResult,
} from './providers/CloudinaryProvider';

// Réexporter les interfaces et types du core pour compatibilité
export { UploadError, ValidationError } from './core/Errors';
export { defaultLogger } from './core/Logger';
export type { Logger } from './core/Logger';
export type { UploadResult } from './core/UploadResult';
export type { FileMeta, ValidationPolicy } from './core/ValidationPolicy';
export type { Scanner } from './scanner/Scanner';

// Services
export { MultipartService } from './services/MultipartService';
export { PresignedUrlService } from './services/PresignedUrlService';
export { Validator } from './validation/Validator';
