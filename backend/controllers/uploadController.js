const { cloudinary } = require('../config/cloudinary');

exports.uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Multer-storage-cloudinary handles the upload, so req.file.path is the Cloudinary URL
  res.json({
    message: 'File uploaded successfully',
    url: req.file.path,
    public_id: req.file.filename
  });
};
