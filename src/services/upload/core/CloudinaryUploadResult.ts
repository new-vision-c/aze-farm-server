export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  key: string;
  size: number;
  contentType: string;
  metadata?: {
    publicId: string;
    format: string;
    width?: string;
    height?: string;
    resourceType: string;
    createdAt: string;
  };
  uploadTime: number;
  error?: string;
}
