import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import MessageBubble from "./MessageBubble";
import "./ChatBox.css";

const ChatBox = ({
  currentUser,
  selectedUser,
  messages,
  setMessages,
  onSendMessage,
  isOnline,
  isTyping,
  socket,
}) => {
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch message history when user is selected
  useEffect(() => {
    if (!selectedUser) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      setMessages([]);
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/messages/${selectedUser._id}`
        );
        setMessages(data.messages);
      } catch (error) {
        console.error("Error fetching message history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
    inputRef.current?.focus();
  }, [selectedUser?._id]);

  // Filter messages to only those in this conversation
  const conversationMessages = messages.filter(
    (m) =>
      (m.senderId?._id === currentUser._id &&
        m.receiverId?._id === selectedUser?._id) ||
      (m.senderId?._id === selectedUser?._id &&
        m.receiverId?._id === currentUser._id) ||
      // Handle non-populated IDs
      (m.senderId === currentUser._id && m.receiverId === selectedUser?._id) ||
      (m.senderId === selectedUser?._id && m.receiverId === currentUser._id)
  );

  // Handle typing indicators
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (socket && selectedUser) {
      socket.emit("typing", {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
      });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", {
          senderId: currentUser._id,
          receiverId: selectedUser._id,
        });
      }, 1500);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedUser) return;

    // Stop typing indicator
    if (socket) {
      socket.emit("stopTyping", {
        senderId: currentUser._id,
        receiverId: selectedUser._id,
      });
    }
    clearTimeout(typingTimeoutRef.current);

    onSendMessage(trimmed);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (username) =>
    username ? username.slice(0, 2).toUpperCase() : "??";

  const getAvatarColor = (username) => {
    const colors = [
      "#25d366", "#00bcd4", "#9c27b0", "#ff5722",
      "#3f51b5", "#e91e63", "#ff9800", "#4caf50",
    ];
    if (!username) return colors[0];
    return colors[username.charCodeAt(0) % colors.length];
  };

  // ── No user selected ──
  if (!selectedUser) {
    return (
      <div className="chatbox-empty">
        <div className="chatbox-empty-inner">
          <div className="chatbox-empty-icon">💬</div>
          <h2>Chatty Chat</h2>
          <p>Select a user from the sidebar to start chatting.</p>
          <div className="chatbox-empty-hints">
            <span>🟢 Green bubbles = your messages</span>
            <span>⚪ Gray bubbles = received messages</span>
            <span>⚡ Real-time via Socket.io</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbox">
      {/* Header */}
      <div className="chatbox-header">
        <div className="chatbox-header-left">
          <div
            className="chatbox-avatar"
            style={{ background: getAvatarColor(selectedUser.username) }}
          >
            {getInitials(selectedUser.username)}
            {isOnline && <span className="chatbox-online-ring" />}
          </div>
          <div className="chatbox-header-info">
            <span className="chatbox-header-name">{selectedUser.username}</span>
            <span className={`chatbox-header-status ${isOnline ? "online" : "offline"}`}>
              {isTyping
                ? "typing..."
                : isOnline
                ? "Online"
                : "Offline"}
            </span>
          </div>
        </div>
        <div className="chatbox-header-actions">
          <button className="header-action-btn" title="Voice call (coming soon)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.39 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button className="header-action-btn" title="Video call (coming soon)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chatbox-messages">
        {loadingHistory ? (
          <div className="messages-loading">
            <div className="loading-spinner" />
            <span>Loading messages...</span>
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="messages-empty">
            <div className="messages-empty-avatar"
              style={{ background: getAvatarColor(selectedUser.username) }}>
              {getInitials(selectedUser.username)}
            </div>
            <p>No messages yet.</p>
            <span>Say hi to <strong>{selectedUser.username}</strong>! 👋</span>
          </div>
        ) : (
          conversationMessages.map((msg, index) => {
            const prev = conversationMessages[index - 1];
            const senderId = msg.senderId?._id || msg.senderId;
            const isMine = senderId === currentUser._id;
            const prevSenderId = prev?.senderId?._id || prev?.senderId;
            const showAvatar = !isMine && prevSenderId !== senderId;

            return (
              <MessageBubble
                key={msg._id || index}
                message={msg}
                isMine={isMine}
                showAvatar={showAvatar}
                currentUser={currentUser}
                selectedUser={selectedUser}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <span />
              <span />
              <span />
            </div>
            <span className="typing-text">{selectedUser.username} is typing</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chatbox-input-area">
        <div className="chatbox-input-wrap">
          <button className="attach-btn" title="Attach file (coming soon)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedUser.username}...`}
            className="chatbox-input"
            rows={1}
          />
          <button
            className={`send-btn ${input.trim() ? "active" : ""}`}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="chatbox-hint">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default ChatBox;
