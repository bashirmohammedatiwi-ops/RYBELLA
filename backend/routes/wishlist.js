const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

router.get('/', auth, wishlistController.getWishlist);
router.post('/:productId', auth, wishlistController.addToWishlist);
router.delete('/:productId', auth, wishlistController.removeFromWishlist);

module.exports = router;
