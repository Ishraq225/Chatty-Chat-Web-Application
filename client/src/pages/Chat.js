import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket, getSocket } from "../socket";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import "./Chat.css";

const Chat = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: true/false }

  // Connect socket on mount
  useEffect(() => {
    if (!user?._id) return;
    const s = connectSocket(user._id);
    setSocket(s);

    // Receive updated online users list
    s.on("getUsers", (users) => setOnlineUsers(users));

    // Receive incoming message in real time
    s.on("receiveMessage", (newMsg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    });

    // Own sent message confirmed by server
    s.on("messageSent", (newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    });

    // Typing indicators
    s.on("userTyping", ({ senderId }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
    });

    s.on("userStopTyping", ({ senderId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[senderId];
        return updated;
      });
    });

    return () => {
      s.off("getUsers");
      s.off("receiveMessage");
      s.off("messageSent");
      s.off("userTyping");
      s.off("userStopTyping");
    };
  }, [user?._id]);

  // Mark messages as read when user opens a conversation
  useEffect(() => {
    if (selectedUser && socket) {
      socket.emit("markRead", {
        senderId: selectedUser._id,
        receiverId: user._id,
      });
    }
  }, [selectedUser, socket, user?._id]);

  const handleSendMessage = useCallback(
    (messageText) => {
      if (!socket || !selectedUser || !messageText.trim()) return;
      socket.emit("sendMessage", {
        senderId: user._id,
        receiverId: selectedUser._id,
        message: messageText.trim(),
      });
    },
    [socket, selectedUser, user?._id]
  );

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
    navigate("/login");
  };

  const isSelectedUserOnline = selectedUser
    ? onlineUsers.includes(selectedUser._id)
    : false;

  const isSelectedUserTyping = selectedUser
    ? !!typingUsers[selectedUser._id]
    : false;

  return (
    <div className="chat-page">
      <Sidebar
        currentUser={user}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onlineUsers={onlineUsers}
        onLogout={handleLogout}
        messages={messages}
      />
      <ChatBox
        currentUser={user}
        selectedUser={selectedUser}
        messages={messages}
        setMessages={setMessages}
        onSendMessage={handleSendMessage}
        isOnline={isSelectedUserOnline}
        isTyping={isSelectedUserTyping}
        socket={socket}
      />
    </div>
  );
};

export default Chat;
