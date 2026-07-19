import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const hasCloudinaryConfig = Boolean(cloudName && apiKey && apiSecret);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn('Cloudinary credentials missing; images will be stored as in-memory data URLs so product creation can complete without hanging.');
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
export default cloudinary;
