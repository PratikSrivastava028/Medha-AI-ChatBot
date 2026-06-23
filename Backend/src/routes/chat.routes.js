const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

router.post('/', authMiddleware.authUser, chatController.createChat);
router.get('/', authMiddleware.authUser, chatController.getUserChats);
router.get('/:chatId/messages', authMiddleware.authUser, chatController.getChatMessages);

module.exports = router;