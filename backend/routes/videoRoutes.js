const express = require('express');
const router = express.Router();
const multer = require('multer');
const { videoStorage } = require('../config/cloudinary');
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');

// Configure multer with video storage and limits
const upload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

// GET /api/user/demo-videos/feed (Public)
router.get('/feed', videoController.getVideoFeed);

// All other routes protected
router.use(authMiddleware);

// POST /api/user/demo-videos/upload
router.post('/upload', upload.single('video'), videoController.uploadDemoVideo);

// GET /api/user/demo-videos
router.get('/', videoController.getDemoVideos);

// DELETE /api/user/demo-videos/:publicId
// Note: publicId might contain slashes (e.g. skillswap/videos/abc), so we might need to handle that.
// However, Express params usually handle it if encoded properly, or we can pass it in body.
// Standard REST uses params. Let's assume the client encodes it.
router.delete('/:publicId(*)', videoController.deleteDemoVideo);

module.exports = router;
