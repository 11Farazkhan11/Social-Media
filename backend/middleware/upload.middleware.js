import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  },
});

export const uploadSingle = (fieldName) => upload.single(fieldName);

export const handleUpload = (folder, resourceType = 'auto') => async (req, res, next) => {
  try {
    if (!req.file) return next();

    const result = await uploadToCloudinary(req.file.buffer, folder, resourceType);
    req.uploadedFile = {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type,
    };
    next();
  } catch (error) {
    next(error);
  }
};
