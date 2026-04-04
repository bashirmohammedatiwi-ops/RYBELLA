const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', categoryController.getAll);
router.put('/reorder', auth, adminAuth, categoryController.reorder);
router.get('/:id', categoryController.getById);
router.post('/', auth, adminAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon_image', maxCount: 1 }]), categoryController.create);
router.put('/:id', auth, adminAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon_image', maxCount: 1 }]), categoryController.update);
router.delete('/:id', auth, adminAuth, categoryController.delete);

module.exports = router;
