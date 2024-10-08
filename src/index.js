const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dotenv = require("dotenv");
const initializeSocket = require("./services/socketService");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");

const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);


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
