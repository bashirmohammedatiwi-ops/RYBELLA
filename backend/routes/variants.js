const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.put('/:id', auth, adminAuth, upload.single('image'), variantController.update);
router.delete('/:id', auth, adminAuth, variantController.delete);

module.exports = router;
