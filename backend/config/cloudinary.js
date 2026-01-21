const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for general uploads (images, etc.)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skillswap',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    resource_type: 'auto'
  }
});

// Storage specifically for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skillswap/videos',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
    resource_type: 'video'
  }
});

module.exports = {
  cloudinary,
  storage,
  videoStorage
};
