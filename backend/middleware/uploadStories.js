const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_PATH || './uploads';
const maxImageSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
const maxVideoSize = parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024; // 50MB

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || (file.mimetype?.startsWith('video/') ? '.mp4' : '.jpg');
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/i;
  const videoTypes = /mp4|webm|mov|quicktime/i;
  const ext = (path.extname(file.originalname) || '').slice(1);
  const mime = file.mimetype || '';
  const isImage = (ext && imageTypes.test(ext)) || /^image\//.test(mime);
  const isVideo = (ext && videoTypes.test(ext)) || /^video\//.test(mime);
  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. استخدم: jpg, png, gif, webp, mp4, webm'), false);
  }
};

const storyUpload = multer({
  storage,
  limits: { fileSize: Math.max(maxImageSize, maxVideoSize) },
  fileFilter
});

module.exports = storyUpload;
