const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', subcategoryController.getAll);
router.put('/reorder', auth, adminAuth, subcategoryController.reorder);
router.get('/:id', subcategoryController.getById);
router.post('/', auth, adminAuth, upload.single('image'), subcategoryController.create);
router.put('/:id', auth, adminAuth, upload.single('image'), subcategoryController.update);
router.delete('/:id', auth, adminAuth, subcategoryController.delete);

module.exports = router;
