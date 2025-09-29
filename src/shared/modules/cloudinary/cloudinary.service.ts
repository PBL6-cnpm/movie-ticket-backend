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
          if (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return reject(err);
          }
          if (!result || !result.secure_url) {
            return reject(new Error('Upload failed: no secure_url returned'));
          }
          const secureUrl: string = result.secure_url;
          resolve(secureUrl);
        }) as UploadStreamCallback
      );
      uploadStream.end(file.buffer);
    });
  }
}
