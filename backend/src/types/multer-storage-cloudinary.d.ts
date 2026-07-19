declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  export class CloudinaryStorage implements StorageEngine {
    constructor(options?: unknown);
    _handleFile: (...args: unknown[]) => unknown;
    _removeFile: (...args: unknown[]) => unknown;
  }
}
