const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("../models/messageModel");
const logger = require("../config/logger");

const activeUsers = new Set();

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "*",
    },
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      threshold: 1024, // Only compress messages above 1KB
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        logger.info("User: ", user);
        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    } else {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    activeUsers.add(socket.id);
    console.log(`User Connected: ${socket.id}`);

    socket.on("joinConversation", (conversationId) => {
      try {
        socket.join(conversationId);
        console.log(
          `User with ID: ${socket.id} joined conversation: ${conversationId}`
        );

        socket.to(conversationId).emit("userJoined", {
          userId: socket.id,
          message: "joined the chat",
        });
      } catch (error) {
        logger.error(`Error joining conversation: ${error.message}`);
        socket.emit("error", { message: "Error joining conversation" });
      }
    });

    socket.on("sendMessage", async (data) => {
      try {
        const message = new Message({
          conversationId: data.conversationId,
          sender: data.sender,
          text: data.text,
        });
        await message.save();
        io.to(data.conversationId).emit("receiveMessage", data);
      } catch (error) {
        logger.error(`Error sending message: ${error.message}`);
        socket.emit("error", { message: "Error sending message" });
      }
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      console.log("User Disconnected", socket.id);
    });
  });
};

module.exports = initializeSocket;
