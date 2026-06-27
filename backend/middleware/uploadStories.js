const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_PATH || './uploads';
const maxImageSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
const maxVideoSize = parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024;

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

const isVideoFile = (file) => {
  const videoTypes = /mp4|webm|mov|quicktime/i;
  const ext = (path.extname(file.originalname) || '').slice(1);
  const mime = file.mimetype || '';
  return (ext && videoTypes.test(ext)) || /^video\//.test(mime);
};

const isImageFile = (file) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/i;
  const ext = (path.extname(file.originalname) || '').slice(1);
  const mime = file.mimetype || '';
  return (ext && imageTypes.test(ext)) || /^image\//.test(mime);
};

const fileFilter = (req, file, cb) => {
  const field = file.fieldname || '';
  if (field === 'avatar' || field === 'cover') {
    if (isImageFile(file)) return cb(null, true);
    return cb(new Error('صورة الغلاف يجب أن تكون jpg أو png أو webp'), false);
  }
  if (field === 'videos' || field === 'images') {
    if (isVideoFile(file) || isImageFile(file)) return cb(null, true);
    return cb(new Error('استخدم صورة (jpg, png, webp) أو فيديو (mp4, webm, mov)'), false);
  }
  if (isVideoFile(file) || isImageFile(file)) return cb(null, true);
  cb(new Error('نوع الملف غير مدعوم'), false);
};

const storyUpload = multer({
  storage,
  limits: { fileSize: Math.max(maxImageSize, maxVideoSize) },
  fileFilter
});

module.exports = storyUpload;
