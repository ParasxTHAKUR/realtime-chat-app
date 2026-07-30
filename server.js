require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const socketAuth = require("./middleware/socketAuth");

connectDB();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Chat app server is alive!");
});

// Wrap Express in a raw HTTP server so Socket.io can attach to it
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`${socket.user.username} connected:`, socket.id);

  socket.on("disconnect", () => {
    console.log(`${socket.user.username} disconnected:`, socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use(express.static("public"));