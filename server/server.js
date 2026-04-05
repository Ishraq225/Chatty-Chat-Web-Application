const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars FIRST
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const initSocket = require("./socket/socket");

// ─────────────────────────────────────────────
// Initialize App
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app); // Wrap express in http server for Socket.io

// ─────────────────────────────────────────────
// Connect to MongoDB
// ─────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.post("/api/register", (req, res) => {
  console.log(req.body);
  res.json({ success: true, message: "Working!" });
});
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Chatty Chat API is running! ",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// ─────────────────────────────────────────────
// Initialize Socket.io
// ─────────────────────────────────────────────
initSocket(server);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║        Chatty Chat Server           ║
  ║  Running on http://localhost:${PORT}    ║
  ║  Environment: ${process.env.NODE_ENV || "development"}         ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = server;
