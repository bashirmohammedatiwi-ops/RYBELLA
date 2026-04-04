const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const bannerUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'background_image', maxCount: 1 }]);

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

router.get('/', bannerController.getAll);
router.get('/admin', auth, adminAuth, bannerController.getAllAdmin);
router.post('/', auth, adminAuth, (req, res, next) => {
  bannerUpload(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, bannerController.create);
router.put('/:id', auth, adminAuth, (req, res, next) => {
  bannerUpload(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, bannerController.update);
router.delete('/:id', auth, adminAuth, bannerController.delete);

module.exports = router;
