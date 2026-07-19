import { CldUploadWidget } from 'next-cloudinary';

export const uploadToCloudinary = async (
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', cloudName);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const getCloudinaryUrl = (publicId: string, options = '') => {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${options}/${publicId}`;
};
