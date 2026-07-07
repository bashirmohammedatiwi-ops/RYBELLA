const express = require('express');
const router = express.Router();
const storefrontController = require('../controllers/storefrontController');

router.get('/home', storefrontController.getHome);

module.exports = router;
