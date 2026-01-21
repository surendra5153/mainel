const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');

const upload = multer({ storage: storage });

// POST /api/upload
// Protected route
router.post('/', authMiddleware, upload.single('file'), uploadController.uploadFile);

module.exports = router;
