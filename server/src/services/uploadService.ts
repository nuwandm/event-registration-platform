import { cloudinary } from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';

export interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadService = {
  async uploadImage(buffer: Buffer, folder: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png'],
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(new AppError('Image upload failed', 500));
          } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        }
      );
      stream.end(buffer);
    });
  },

  async uploadFile(buffer: Buffer, folder: string, originalName: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const isPdf = originalName.toLowerCase().endsWith('.pdf');
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isPdf ? 'raw' : 'image',
          allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png'],
        },
        (error, result) => {
          if (error || !result) {
            reject(new AppError('File upload failed', 500));
          } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        }
      );
      stream.end(buffer);
    });
  },

  async deleteFile(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  },
};
