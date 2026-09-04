require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const socketAuth = require("./middleware/socketAuth");
const messageRoutes = require("./routes/messages");
const Message = require("./models/Message"); 

connectDB();

const app = express();
const cors = require("cors");

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static("public"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Chat app server is alive!");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.use(socketAuth);

const onlineUsers = new Map(); 



io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  console.log(`${socket.user.username} connected:`, socket.id);

  onlineUsers.set(userId, socket.id); 
  socket.emit("onlineUsersList", Array.from(onlineUsers.keys()));
  socket.broadcast.emit("userOnline", { userId });

  socket.on("sendMessage", async ({ receiverId, content }) => {
    try {
      if (!receiverId || !content?.trim()) return;

      const message = await Message.create({
        sender: userId,
        receiver: receiverId,
        content: content.trim(),
      });

      socket.emit("receiveMessage", message);

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", message);
      }
    } catch (err) {
      socket.emit("errorMessage", { message: "Message failed to send" });
    }
  });

  socket.on("typing", ({ receiverId }) => {
  const receiverSocketId = onlineUsers.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("userTyping", { userId });
  }
});

socket.on("stopTyping", ({ receiverId }) => {
  const receiverSocketId = onlineUsers.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("userStopTyping", { userId });
  }
});

  
socket.on("disconnect", () => {
    console.log(`${socket.user.username} disconnected:`, socket.id);
    onlineUsers.delete(userId);
    socket.broadcast.emit("userOffline", { userId });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});