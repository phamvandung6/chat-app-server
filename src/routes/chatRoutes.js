const express = require("express");
const {
  sendMessage,
  getMessages,
  createRoom,
  getRooms,
  deleteMessage,
} = require("../controllers/chatController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/send", auth, sendMessage);
router.get("/history/:room", auth, getMessages);
router.post("/create", auth, createRoom);
router.get("/rooms", auth, getRooms);
router.delete("/message/:id", auth, deleteMessage);

module.exports = router;
