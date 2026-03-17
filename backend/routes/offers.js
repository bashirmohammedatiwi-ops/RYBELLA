const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', offerController.getAll);
router.get('/admin', auth, adminAuth, offerController.getAllAdmin);
router.get('/:id', offerController.getById);
router.post('/', auth, adminAuth, upload.single('image'), offerController.create);
router.put('/:id', auth, adminAuth, upload.single('image'), offerController.update);
router.delete('/:id', auth, adminAuth, offerController.delete);

module.exports = router;
