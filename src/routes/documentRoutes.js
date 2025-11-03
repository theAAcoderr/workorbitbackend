const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { authMiddleware } = require('../middleware/auth');

// Check if S3 storage should be used
const useS3Storage = process.env.USE_S3_STORAGE === 'true' &&
                     process.env.AWS_ACCESS_KEY_ID &&
                     process.env.AWS_SECRET_ACCESS_KEY;

let upload;

if (useS3Storage) {
  // Use S3 storage
  console.log('📦 Document storage: AWS S3');
  const { uploadS3 } = require('../services/s3Service');
  upload = uploadS3;
} else {
  // Use local disk storage
  console.log('📦 Document storage: Local disk');

  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '../../uploads/documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure multer for local file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename: timestamp-randomstring-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
  });

  // File filter to allow specific file types
  const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const allowedTypes = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };

  // Multer upload configuration for local storage
  upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  });
}

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/documents/upload
 * @desc    Upload a document
 * @access  Private
 */
router.post('/upload', upload.single('file'), documentController.uploadDocument);

/**
 * @route   GET /api/v1/documents
 * @desc    Get all documents with filtering
 * @access  Private
 */
router.get('/', documentController.getAllDocuments);

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get('/:id', documentController.getDocumentById);

/**
 * @route   PUT /api/v1/documents/:id
 * @desc    Update document metadata
 * @access  Private (Owner/Admin/HR)
 */
router.put('/:id', documentController.updateDocument);

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete document
 * @access  Private (Owner/Admin/HR)
 */
router.delete('/:id', documentController.deleteDocument);

/**
 * @route   GET /api/v1/documents/:id/download
 * @desc    Download document
 * @access  Private
 */
router.get('/:id/download', documentController.downloadDocument);

module.exports = router;