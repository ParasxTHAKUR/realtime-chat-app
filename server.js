require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

connectDB();

const app = express();

app.use(express.json());          // <-- new: lets Express parse JSON request bodies
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Chat app server is alive!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});