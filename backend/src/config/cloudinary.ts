import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

const hasCloudinaryConfig = Boolean(cloudinaryUrl || (cloudName && apiKey && apiSecret));

if (hasCloudinaryConfig) {
  cloudinary.config(cloudinaryUrl ? { cloudinary_url: cloudinaryUrl } : {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn('Cloudinary credentials missing; image uploads will be rejected until Cloudinary is configured.');
}

const storage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

export const upload = uploadMiddleware;
export const cloudinaryConfigured = hasCloudinaryConfig;
export const uploadBuffer = (buffer: Buffer, folder: string): Promise<{ url: string; cloudinaryId: string }> => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
    if (error || !result) {
      reject(error || new Error('Cloudinary upload failed'));
      return;
    }
    resolve({ url: result.secure_url, cloudinaryId: result.public_id });
  });
  stream.end(buffer);
});
export default cloudinary;
