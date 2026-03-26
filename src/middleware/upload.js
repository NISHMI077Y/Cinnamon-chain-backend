const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const s3Client = require('../config/s3');
const { AWS_S3_BUCKET } = require('../config/env');
const AppError = require('../utils/AppError');

const imageFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPG, PNG, and WebP images are allowed', 400, 'INVALID_FILE_TYPE'));
  }
};

const pdfFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are accepted', 400, 'INVALID_FILE_TYPE'));
  }
};

const createS3Storage = (folder) =>
  multerS3({
    s3: s3Client,
    bucket: AWS_S3_BUCKET,
    metadata: (_req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${folder}/${uuidv4()}${ext}`);
    },
  });

const uploadImages = multer({
  storage: createS3Storage('listings'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).array('images', 5);

const uploadPDF = multer({
  storage: createS3Storage('lab-reports'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: pdfFilter,
}).single('pdf_report');

module.exports = { uploadImages, uploadPDF };