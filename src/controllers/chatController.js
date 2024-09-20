const Message = require('../models/messageModel');
const Group = require('../models/groupModel');
const User = require('../models/userModel');
const logger = require('../config/logger');

exports.saveMessage = async (req, res) => {
    const { recipient, sender, content } = req.body; // Include recipient
    try {
        // Check if the recipient is valid
        const recipientUser = await User.findById(recipient);
        if (!recipientUser) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Check if a group already exists between the sender and recipient
        let group = await Group.findOne({
            members: { $all: [sender, recipient] } // Check for both members
        });

        // If no group exists, create a new one
        if (!group) {
            group = new Group({
                name: `Chat between ${sender} and ${recipient}`,
                members: [sender, recipient]
            });
            await group.save();
        }

        // Create a new message in the found or newly created group
        const message = new Message({ room: group._id, sender, content });
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        logger.error('Error saving message: ', { error });
        res.status(500).json({ message: 'Error saving message' });
    }
};

exports.getMessages = async (req, res) => {
    const { room } = req.params;
    try {
        const messages = await Message.find({ room }).populate('sender');
        res.status(200).json(messages);
    } catch (error) {
        logger.error('Error fetching messages: ', { error });
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

exports.deleteMessage = async (req, res) => {
    const { id } = req.params;
    try {
        await Message.findByIdAndDelete(id);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        logger.error('Error deleting message: ', { error });
        res.status(500).json({ message: 'Error deleting message' });
    }
};