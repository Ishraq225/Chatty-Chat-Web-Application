import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (userId) => {
  if (socket && socket.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    socket.emit("addUser", userId);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
