// client/src/context/useSocket.js
import { useContext } from "react";
import { SocketContext } from "./SocketContext";

export function useSocket() {
  return useContext(SocketContext);
}
