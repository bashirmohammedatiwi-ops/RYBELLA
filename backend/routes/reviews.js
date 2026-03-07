const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, reviewController.getAll);
router.get('/products/:productId', reviewController.getByProduct);
router.post('/', auth, reviewController.create);
router.delete('/:id', auth, adminAuth, reviewController.delete);

module.exports = router;
