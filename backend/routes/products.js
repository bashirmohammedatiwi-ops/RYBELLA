const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const variantController = require('../controllers/variantController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', productController.getAll);
router.get('/filters', productController.getFilters);
router.put('/reorder', auth, adminAuth, productController.reorder);
router.get('/:id', productController.getById);
router.get('/:id/reviews', productController.getReviews);
router.post('/:id/duplicate', auth, adminAuth, productController.duplicate);
router.post('/:id/variants', auth, adminAuth, upload.single('image'), variantController.create);
router.post('/', auth, adminAuth, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), productController.create);
router.put('/:id', auth, adminAuth, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), productController.update);
router.delete('/:id', auth, adminAuth, productController.delete);

module.exports = router;
