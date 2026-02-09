export class PresignedUrlService {
  constructor(private provider: any) {}

  async presignedPut(filename: string, key: string, expiresSeconds = 300) {
    const url = await this.provider.presignedPutUrl(key, expiresSeconds);
    return { url, key };
  }

  async presignedGet(key: string, expiresSeconds = 3600) {
    return this.provider.presignedGetUrl(key, expiresSeconds);
  }

  async getPresignedUploadUrl(filename: string, expiresInSeconds: number = 3600): Promise<string> {
    return this.provider.presignedPutUrl(filename, expiresInSeconds);
  }
}
