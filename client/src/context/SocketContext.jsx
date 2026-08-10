import { createContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";

export const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io("http://localhost:5000", { auth: { token } });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setSocket(newSocket);
    });

    newSocket.on("userOnline", ({ userId }) => {
      setOnlineUserIds((prev) => [...prev, userId]);
    });

    newSocket.on("userOffline", ({ userId }) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUserIds }}>
      {children}
    </SocketContext.Provider>
  );
}
