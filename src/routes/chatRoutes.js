const express = require("express");
const {
  sendMessage,
  getMessages,
  createConversation,
  getConversations,
  deleteMessage,
} = require("../controllers/chatController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/send", auth, sendMessage);
router.get("/history/:conversationId", auth, getMessages);
router.post("/create", auth, createConversation);
router.get("/conversations", auth, getConversations);
router.delete("/message/:id", auth, deleteMessage);

module.exports = router;
