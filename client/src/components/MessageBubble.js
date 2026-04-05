import React from "react";
import { format, isToday, isYesterday } from "date-fns";
import "./MessageBubble.css";

const MessageBubble = ({ message, isMine, showAvatar, currentUser, selectedUser }) => {
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return format(date, "HH:mm");
  };

  const formatDateDivider = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "read":
        return (
          // Double blue tick (read)
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 5L4.5 8.5L10 2" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 5L9.5 8.5L15 2" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "delivered":
        return (
          // Double gray tick (delivered)
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 5L4.5 8.5L10 2" stroke="#8eab8e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 5L9.5 8.5L15 2" stroke="#8eab8e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          // Single gray tick (sent)
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 2" stroke="#8eab8e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  if (message.isDeleted) {
    return (
      <div className={`bubble-row ${isMine ? "mine" : "theirs"}`}>
        <div className="bubble deleted-bubble">
          <em>🚫 This message was deleted</em>
        </div>
      </div>
    );
  }

  return (
    <div className={`bubble-row ${isMine ? "mine" : "theirs"}`}>
      <div className={`bubble ${isMine ? "bubble-mine" : "bubble-theirs"}`}>
        <span className="bubble-text">{message.message}</span>
        <div className="bubble-meta">
          <span className="bubble-time">{formatTime(message.createdAt)}</span>
          {isMine && (
            <span className="bubble-status">
              {getStatusIcon(message.status)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
