const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
const User = require("../models/userModel");
const logger = require("../config/logger");

exports.sendMessage = async (req, res) => {
  const { conversationId, text } = req.body;
  const sender = req.user.id;

  const message = new Message({ sender, conversationId, text });

  try {
    await message.save();
    res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error sending message" });
  }
};

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const messages = await Message.find({ conversationId }).populate(
      "sender",
      "username"
    );
    res.status(200).json(messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error retrieving messages" });
  }
};

exports.createConversation = async (req, res) => {
  const { members } = req.body; // Không cần nhận conversationName từ request
  const userId = req.user.id;

  if (!members || members.length < 1) {
    return res
      .status(400)
      .json({ message: "At least one member is required." });
  }

  if (!members.includes(userId)) {
    members.push(userId);
  }

  if (members.length > 2 && !req.body.conversationName) {
    return res
      .status(400)
      .json({ message: "Conversation name is required for group chat" });
  }
  try {
    let conversation;

    if (members.length === 2) {
      // Tìm xem đã có cuộc trò chuyện nào giữa 2 người này chưa
      conversation = await Conversation.findOne({
        isGroup: false,
        members: { $size: 2, $all: members },
      });
    }

    if (!conversation) {
      // Nếu chưa có, tạo mới cuộc trò chuyện
      conversation = new Conversation({
        name: members.length > 2 ? req.body.conversationName : "", // Chỉ đặt tên nếu là nhóm chat
        isGroup: members.length > 2,
        members: members,
      });
      await conversation.save();
    }

    // Cập nhật danh sách cuộc trò chuyện cho người dùng
    await User.updateMany(
      { _id: { $in: members } },
      { $addToSet: { conversations: conversation._id } }
    );

    res.status(201).json({
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error creating conversation" });
  }
};

exports.getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await Conversation.find({ members: userId });
    res.status(200).json(conversations);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error retrieving conversations" });
  }
};

exports.deleteMessage = async (req, res) => {
  const { id } = req.params;

  try {
    await Message.findByIdAndDelete(id);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error deleting message" });
  }
};
