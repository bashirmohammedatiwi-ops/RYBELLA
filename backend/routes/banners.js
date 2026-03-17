const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', bannerController.getAll);
router.get('/admin', auth, adminAuth, bannerController.getAllAdmin);
router.post('/', auth, adminAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'background_image', maxCount: 1 }]), bannerController.create);
router.put('/:id', auth, adminAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'background_image', maxCount: 1 }]), bannerController.update);
router.delete('/:id', auth, adminAuth, bannerController.delete);

module.exports = router;
