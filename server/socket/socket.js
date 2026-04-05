const { Server } = require("socket.io");
const Message = require("../models/Message");
const User = require("../models/User");

// Map: userId -> socketId
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ──────────────────────────────────────────
    // EVENT: addUser
    // Called when a user logs in / opens the app
    // ──────────────────────────────────────────
    socket.on("addUser", async (userId) => {
      if (!userId) return;

      // Store mapping
      onlineUsers.set(userId, socket.id);
      socket.userId = userId; // attach to socket for cleanup

      // Update DB
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      } catch (e) {
        console.error("addUser DB error:", e.message);
      }

      // Broadcast updated online user list to ALL clients
      io.emit("getUsers", Array.from(onlineUsers.keys()));

      console.log(` User online: ${userId} | Online count: ${onlineUsers.size}`);
    });

    // ──────────────────────────────────────────
    // EVENT: sendMessage
    // Sender emits this; we forward to receiver
    // ──────────────────────────────────────────
    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      try {
        if (!senderId || !receiverId || !message?.trim()) return;

        // Save message to DB
        const newMessage = await Message.create({
          senderId,
          receiverId,
          message: message.trim(),
          status: "sent",
        });

        const populated = await newMessage.populate([
          { path: "senderId", select: "username avatar" },
          { path: "receiverId", select: "username avatar" },
        ]);

        // Get receiver's socket
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          // Deliver to receiver
          io.to(receiverSocketId).emit("receiveMessage", populated);

          // Update status to delivered
          await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });
          populated.status = "delivered";
        }

        // Also send back to sender (to update their UI with the saved message)
        socket.emit("messageSent", populated);

      } catch (error) {
        console.error("sendMessage error:", error.message);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // ──────────────────────────────────────────
    // EVENT: typing
    // Forward typing indicator to receiver
    // ──────────────────────────────────────────
    socket.on("typing", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { senderId });
      }
    });

    // ──────────────────────────────────────────
    // EVENT: stopTyping
    // Forward stop-typing indicator to receiver
    // ──────────────────────────────────────────
    socket.on("stopTyping", ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStopTyping", { senderId });
      }
    });

    // ──────────────────────────────────────────
    // EVENT: markRead
    // Notify sender their messages were read
    // ──────────────────────────────────────────
    socket.on("markRead", async ({ senderId, receiverId }) => {
      try {
        await Message.updateMany(
          {
            senderId,
            receiverId,
            status: { $in: ["sent", "delivered"] },
          },
          { $set: { status: "read", readAt: new Date() } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesRead", { by: receiverId });
        }
      } catch (error) {
        console.error("markRead error:", error.message);
      }
    });

    // ──────────────────────────────────────────
    // EVENT: disconnect
    // Clean up when user disconnects
    // ──────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(` Socket disconnected: ${socket.id}`);

      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        try {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (e) {
          console.error("disconnect DB error:", e.message);
        }

        // Broadcast updated list
        io.emit("getUsers", Array.from(onlineUsers.keys()));
        console.log(` User offline: ${socket.userId} | Online count: ${onlineUsers.size}`);
      }
    });
  });

  return io;
};

module.exports = initSocket;
