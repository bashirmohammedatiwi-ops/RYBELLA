const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, userController.getAll);
router.get('/lookup', auth, adminAuth, userController.lookupByPhone);
router.post('/release-phone', auth, adminAuth, userController.releasePhone);
router.get('/:id', auth, userController.getById);
router.delete('/:id', auth, adminAuth, userController.delete);

module.exports = router;
