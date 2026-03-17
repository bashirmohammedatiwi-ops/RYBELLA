const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const storyUpload = upload.array('images', 10);

const handleMulterError = (err, req, res, next) => {
  if (err) {
    let msg = 'خطأ في رفع الملف';
    if (err.code === 'LIMIT_FILE_SIZE') msg = 'حجم الملف كبير جداً (الحد 5MB)';
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') msg = 'اسم حقل الملف غير متوقع';
    else if (err.message) msg = err.message;
    return res.status(400).json({ message: msg });
  }
  next();
};

router.get('/', storyController.getAll);
router.get('/admin', auth, adminAuth, storyController.getAllAdmin);
router.post('/', auth, adminAuth, (req, res, next) => {
  storyUpload(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, storyController.create);
router.delete('/:id', auth, adminAuth, storyController.delete);

module.exports = router;
