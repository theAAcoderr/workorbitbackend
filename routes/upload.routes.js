const express = require('express');
const router = express.Router();
const multer = require('multer');
const s3Service = require('../services/s3.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

router.post('/upload/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const folder = req.body.folder || 'uploads';
    const result = await s3Service.uploadFile(req.file, folder);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/upload/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    const folder = req.body.folder || 'uploads';
    const uploadPromises = req.files.map(file => s3Service.uploadFile(file, folder));
    const results = await Promise.all(uploadPromises);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        uploaded: successful.map(r => r.data),
        failed: failed.length > 0 ? failed : []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/upload/presigned-url', async (req, res) => {
  try {
    const { fileName, folder } = req.body;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'File name is required'
      });
    }

    const result = await s3Service.getSignedUploadUrl(fileName, folder);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/upload/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const result = await s3Service.deleteFile(key);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/upload/download-url/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const expiresIn = parseInt(req.query.expiresIn) || 3600;

    const result = await s3Service.getSignedDownloadUrl(key, expiresIn);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;