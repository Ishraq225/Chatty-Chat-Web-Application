const express = require("express");
const router = express.Router();
const {
  getMessages,
  sendMessage,
  getUsersForSidebar,
  deleteMessage,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

router.get("/users", getUsersForSidebar);          // GET all users for sidebar
router.get("/:receiverId", getMessages);           // GET conversation with a user
router.post("/send/:receiverId", sendMessage);      // POST send a message
router.delete("/:messageId", deleteMessage);        // DELETE soft delete message

module.exports = router;
