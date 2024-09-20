const express = require('express');
const { saveMessage, getMessages, deleteMessage } = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/messages', auth, saveMessage);
router.get('/messages/:room', auth, getMessages);
router.delete('/messages/:id', auth, deleteMessage);

module.exports = router;