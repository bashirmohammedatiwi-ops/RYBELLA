const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', auth, authController.getProfile);
router.put('/me', auth, authController.updateProfile);
router.put('/me/password', auth, authController.changePassword);
router.delete('/me', auth, authController.deleteAccount);

module.exports = router;
