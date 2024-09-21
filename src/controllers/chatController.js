const Message = require("../models/messageModel");
const Room = require("../models/roomModel");
const User = require("../models/userModel");
const logger = require("../config/logger");

exports.sendMessage = async (req, res) => {
  const { room, content, type } = req.body; // Thêm type vào body
  const sender = req.user.id;

  const message = new Message({ sender, room, content, type });

  try {
    await message.save();
    res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
};

exports.getMessages = async (req, res) => {
  const { room } = req.params;

  try {
    const messages = await Message.find({ room }).populate(
      "sender",
      "username"
    );
    res.status(200).json(messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error retrieving messages" });
  }
};

exports.createRoom = async (req, res) => {
  const { roomName, members } = req.body;
  const userId = req.user.id;

  if (!members || members.length < 1) {
    return res
      .status(400)
      .json({ message: "At least one member is required." });
  }

  if (!members.includes(userId)) {
    members.push(userId);
  }

  const room = new Room({
    name: roomName,
    createdBy: userId,
    members: members,
  });

  try {
    await room.save();
    // Update each member's rooms array
    await User.updateMany(
      { _id: { $in: members } },
      { $addToSet: { rooms: room._id } }
    );
    res.status(201).json({ message: "Room created successfully", data: room });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error creating room" });
  }
};

exports.getRooms = async (req, res) => {
  const userId = req.user.id;

  try {
    const rooms = await Room.find({ members: userId });
    res.status(200).json(rooms);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error retrieving rooms" });
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
