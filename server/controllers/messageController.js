const Message = require("../models/Message");
const User = require("../models/User");

// ─────────────────────────────────────────────
// @route   GET /api/messages/:receiverId
// @desc    Get conversation between two users
// @access  Private
// ─────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user._id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch full conversation (both directions), sorted by time
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      isDeleted: false,
    })
      .sort({ createdAt: 1 }) // Oldest first
      .populate("senderId", "username avatar")
      .populate("receiverId", "username avatar");

    // Mark unread messages as read
    await Message.updateMany(
      {
        senderId: receiverId,
        receiverId: senderId,
        status: { $in: ["sent", "delivered"] },
      },
      {
        $set: { status: "read", readAt: new Date() },
      }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/messages/send/:receiverId
// @desc    Send a message (REST fallback)
// @access  Private
// ─────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: message.trim(),
    });

    const populated = await newMessage.populate([
      { path: "senderId", select: "username avatar" },
      { path: "receiverId", select: "username avatar" },
    ]);

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/messages/users
// @desc    Get all users except current user (for sidebar)
// @access  Private
// ─────────────────────────────────────────────
const getUsersForSidebar = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get all users except current, with last message preview
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("-password")
      .sort({ isOnline: -1, username: 1 }); // Online users first

    // Attach last message & unread count for each user
    const usersWithMeta = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: currentUserId, receiverId: user._id },
            { senderId: user._id, receiverId: currentUserId },
          ],
          isDeleted: false,
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: currentUserId,
          status: { $in: ["sent", "delivered"] },
        });

        return {
          ...user.toSafeObject(),
          lastMessage: lastMessage
            ? {
                message: lastMessage.message,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithMeta,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/messages/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
// ─────────────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this message" });
    }

    message.isDeleted = true;
    await message.save();

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getMessages, sendMessage, getUsersForSidebar, deleteMessage };
