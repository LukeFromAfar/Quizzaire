const express = require('express');
const router = express.Router();
const staticController = require('../controllers/staticController');

// Home page
router.get('/', staticController.getHomePage);

// FAQ page
router.get('/faq', staticController.getFaqPage);

module.exports = router;
