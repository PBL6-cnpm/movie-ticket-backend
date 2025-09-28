import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  async uploadFileBuffer(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      interface UploadStreamOptions {
        folder: string;
      }

      interface UploadStreamCallback {
        (error: Error | undefined, result?: UploadApiResponse): void;
      }

      const uploadStream: NodeJS.WritableStream = cloudinary.uploader.upload_stream(
        { folder: 'movies' } as UploadStreamOptions,
        ((error, result?: UploadApiResponse) => {
          if (error) return reject(new Error(error.message || 'Upload failed'));
          resolve(result.secure_url);
        }) as UploadStreamCallback
      );
      uploadStream.end(file.buffer);
    });
  }
}
