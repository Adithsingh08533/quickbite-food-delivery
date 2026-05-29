import multer, { StorageEngine } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import { AppError } from '../utils/AppError';
import config from '../config/config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key:    config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Use memory storage — file buffer is uploaded directly to Cloudinary
const storage: StorageEngine = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 1,
  },
});

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 * @param buffer  File buffer from multer memoryStorage
 * @param folder  Cloudinary folder path (e.g. 'quickbite/restaurants')
 * @param publicId Optional public_id for overwrite-on-update
 */
export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id:     publicId,
        overwrite:     !!publicId,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(new AppError(error.message, 500));
        if (!result) return reject(new AppError('Cloudinary upload failed', 500));
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
