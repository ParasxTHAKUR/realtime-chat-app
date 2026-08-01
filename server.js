require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const socketAuth = require("./middleware/socketAuth");
const Message = require("./models/Message"); // <-- NEW: add this import up here with the others

connectDB();

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Chat app server is alive!");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.use(socketAuth);

const onlineUsers = new Map(); // <-- NEW: declare this once, outside the connection handler

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  console.log(`${socket.user.username} connected:`, socket.id);

  onlineUsers.set(userId, socket.id); // <-- NEW

  // --- NEW: the actual messaging event ---
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
  // --- end new block ---

  socket.on("disconnect", () => {
    console.log(`${socket.user.username} disconnected:`, socket.id);
    onlineUsers.delete(userId); // <-- NEW
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});