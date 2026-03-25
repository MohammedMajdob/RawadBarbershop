import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'rawad-barbershop',
            transformation: [
              { width: 1200, height: 600, crop: 'fill', quality: 'auto', format: 'webp' },
            ],
          },
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload failed', error);
              return reject(error);
            }
            resolve({ url: result!.secure_url });
          },
        )
        .end(file.buffer);
    });
  }
}
