const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dotenv = require("dotenv");
const Message = require("./models/messageModel");
const logger = require("./config/logger");
const initializeSocket = require("./services/socketService");

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);

const server = http.createServer(app);

initializeSocket(server);

// const io = socketIO(server, {
//   cors: {
//     origin: "*",
//   },
// });

// io.on("connection", (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   socket.on("joinConversation", (conversationId) => {
//     socket.join(conversationId);
//     console.log(`User with ID: ${socket.id} joined conversation: ${conversationId}`);

//     socket.to(conversationId).emit("userJoined", {
//       userId: socket.id,
//       message: "joined the chat",
//     });
//   });

//   socket.on("sendMessage", async (data) => {
//     try {
//       const message = new Message({
//         conversationId: data.conversationId,
//         sender: data.sender,
//         text: data.text,
//       });
//       await message.save();
//       io.to(data.conversationId).emit("receiveMessage", data);
//     } catch (error) {
//       logger.error(error);
//       socket.emit("error", { message: "Error sending message" });
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("User Disconnected", socket.id);
//   });
// });

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
