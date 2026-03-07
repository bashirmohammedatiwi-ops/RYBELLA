const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', bannerController.getAll);
router.get('/admin', auth, adminAuth, bannerController.getAllAdmin);
router.post('/', auth, adminAuth, upload.single('image'), bannerController.create);
router.put('/:id', auth, adminAuth, upload.single('image'), bannerController.update);
router.delete('/:id', auth, adminAuth, bannerController.delete);

module.exports = router;
