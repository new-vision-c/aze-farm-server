import type { CloudinaryConfig } from '../providers/CloudinaryProvider';

// Configuration par défaut pour Cloudinary
export const defaultCloudinaryConfig: CloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
};

// Validation de la configuration
export function validateCloudinaryConfig(config: CloudinaryConfig): boolean {
  return !!(config.cloud_name && config.api_key && config.api_secret);
}

// Vérification si Cloudinary est configuré
export function isCloudinaryConfigured(): boolean {
  return validateCloudinaryConfig(defaultCloudinaryConfig);
}
