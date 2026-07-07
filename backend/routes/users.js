const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, adminAuth, staffOrAdminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, userController.getAll);
router.post('/', auth, staffOrAdminAuth, userController.create);
router.get('/:id', auth, userController.getById);
router.delete('/:id', auth, adminAuth, userController.delete);

module.exports = router;
