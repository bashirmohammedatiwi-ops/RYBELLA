const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', brandController.getAll);
router.put('/reorder', auth, adminAuth, brandController.reorder);
router.post('/', auth, adminAuth, upload.single('logo'), brandController.create);
router.put('/:id', auth, adminAuth, upload.single('logo'), brandController.update);
router.delete('/:id', auth, adminAuth, brandController.delete);

module.exports = router;
