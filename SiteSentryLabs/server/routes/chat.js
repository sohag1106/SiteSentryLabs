const express = require('express');
const router = express.Router();
const { submitChat } = require('../controllers/chatController');

// POST /api/chat
router.post('/', submitChat);

module.exports = router;
