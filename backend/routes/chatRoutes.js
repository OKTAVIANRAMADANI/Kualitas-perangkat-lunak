const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/', chatController.getChats);
router.get('/rooms', chatController.getRooms);
router.post('/', chatController.sendChat);

module.exports = router;
