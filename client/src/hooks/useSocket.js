import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      socketRef.current = connectSocket(user._id);
    }
    return () => {
      // Don't disconnect on every re-render; only on full unmount
    };
  }, [user?._id]);

  return socketRef.current || getSocket();
};
