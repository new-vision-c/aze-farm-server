# Service d'Upload Cloudinary

Ce module fournit une solution complète d'upload de fichiers avec Cloudinary
comme provider principal.

## Installation

```bash
bun add cloudinary
```

## Configuration

Variables d'environnement requises :

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

## Utilisation

### Import principal

```typescript
import { CloudinaryUploader } from '@/services/upload';
```

### Initialisation

```typescript
const uploader = new CloudinaryUploader({
  cloudinaryConfig: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  },
  defaultPolicy: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/*', 'video/*'],
  },
  maxRetries: 3,
});
```

### Upload simple

```typescript
const result = await uploader.uploadFile(fileBuffer, {
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
  size: fileBuffer.length,
}, {
  folder: 'avatars',
  resourceType: 'image',
});
```

### Upload multiple

```typescript
const files = [
  { file: buffer1, metadata: { filename: 'img1.jpg', contentType: 'image/jpeg' } },
  { file: buffer2, metadata: { filename: 'img2.jpg', contentType: 'image/jpeg' } },
];

const results = await uploader.uploadMultiple(files, {
  folder: 'gallery',
  concurrency: 2,
});
```

### Suppression

```typescript
// Supprimer un fichier
await uploader.deleteFile('avatars/photo_abc123');

// Supprimer plusieurs fichiers
await uploader.deleteMultiple(['img1', 'img2']);
```

### URL optimisée

```typescript
const optimizedUrl = uploader.getOptimizedUrl('avatars/photo_abc123', {
  width: 300,
  height: 300,
  quality: 80,
  format: 'webp',
});
```

## Événements

Le service émet des événements pour suivre le processus d'upload :

```typescript
uploader.on('uploadStart', ({ file, attempt }) => {
  console.log(`Début upload: ${file}, tentative ${attempt}`);
});

uploader.on('uploadComplete', ({ file, result }) => {
  console.log(`Upload terminé: ${file}`, result);
});

uploader.on('uploadError', ({ file, error, attempt }) => {
  console.error(`Erreur upload: ${file}`, error);
});
```

## Architecture

- **CloudinaryProvider** : Interface directe avec l'API Cloudinary
- **CloudinaryUploader** : Service principal avec validation, retry, événements
- **MultipartService** : Gestion des uploads multiples
- **PresignedUrlService** : Génération d'URLs signées
- **Validator** : Validation des fichiers selon les politiques
- **Scanner** : Intégration antivirus (optionnel)

## Sécurité

- Validation des types MIME et tailles
- Scanning antivirus intégré
- Gestion des erreurs et retries
- URLs signées pour l'upload direct

## Migration depuis MinIO

Le service maintient une compatibilité d'interface avec le système MinIO
existant tout en ajoutant les spécificités de Cloudinary (transformations,
optimisations, etc.).
