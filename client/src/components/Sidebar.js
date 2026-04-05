import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, isToday, isYesterday } from "date-fns";
import "./Sidebar.css";

const Sidebar = ({
  currentUser,
  selectedUser,
  onSelectUser,
  onlineUsers,
  onLogout,
  messages,
}) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/messages/users`
      );
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh user list whenever a new message comes in (to update last message preview)
  useEffect(() => {
    if (messages.length > 0) {
      fetchUsers();
    }
  }, [messages.length]);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "dd/MM/yy");
  };

  const getInitials = (username) => {
    return username ? username.slice(0, 2).toUpperCase() : "??";
  };

  const getAvatarColor = (username) => {
    const colors = [
      "#25d366", "#00bcd4", "#9c27b0", "#ff5722",
      "#3f51b5", "#e91e63", "#ff9800", "#4caf50",
    ];
    if (!username) return colors[0];
    const idx = username.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-user-info">
          <div
            className="sidebar-avatar"
            style={{ background: getAvatarColor(currentUser?.username) }}
          >
            {getInitials(currentUser?.username)}
          </div>
          <div className="sidebar-user-details">
            <span className="sidebar-username">{currentUser?.username}</span>
            <span className="sidebar-status">● Online</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout} title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Online count */}
      <div className="sidebar-online-count">
        <span className="online-dot" />
        {onlineUsers.length} online
      </div>

      {/* User List */}
      <div className="sidebar-users">
        {loading ? (
          <div className="sidebar-loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-user">
                <div className="skeleton-avatar" />
                <div className="skeleton-info">
                  <div className="skeleton-name" />
                  <div className="skeleton-msg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="sidebar-empty">
            <span>😶</span>
            <p>No users found</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isOnline = onlineUsers.includes(u._id);
            const isSelected = selectedUser?._id === u._id;
            const lastMsg = u.lastMessage;

            return (
              <div
                key={u._id}
                className={`user-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectUser(u)}
              >
                <div className="user-item-avatar-wrap">
                  <div
                    className="user-item-avatar"
                    style={{ background: getAvatarColor(u.username) }}
                  >
                    {getInitials(u.username)}
                  </div>
                  {isOnline && <span className="user-online-badge" />}
                </div>

                <div className="user-item-info">
                  <div className="user-item-top">
                    <span className="user-item-name">{u.username}</span>
                    {lastMsg && (
                      <span className="user-item-time">
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="user-item-bottom">
                    <span className="user-item-last-msg">
                      {lastMsg
                        ? lastMsg.senderId === currentUser._id
                          ? `You: ${lastMsg.message}`
                          : lastMsg.message
                        : isOnline
                        ? "Online now"
                        : "Tap to chat"}
                    </span>
                    {u.unreadCount > 0 && (
                      <span className="unread-badge">{u.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
