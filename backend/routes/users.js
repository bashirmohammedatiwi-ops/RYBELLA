const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, userController.getAll);
router.get('/:id', auth, userController.getById);

module.exports = router;
