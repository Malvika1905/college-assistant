const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRoute = require("./routes/chat");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Test route (very useful)
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// ✅ Routes
app.use("/chat", chatRoute);

// ✅ Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});