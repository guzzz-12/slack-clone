"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SocketClientClientSideType } from "@/types/socket";

type WebSocketType = {
  socket: SocketClientClientSideType | null;
  isConnected: boolean;
}

const initialState: WebSocketType = {
  socket: null,
  isConnected: false
}

const WebSocketContext = createContext<WebSocketType>(initialState);

const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<SocketClientClientSideType | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Inicializar la instancia de socket.io
  useEffect(() => {
    const siteUrl = process.env.NEXT_PUBLIC_PROJECT_URL;

    if (!siteUrl) {
      return console.log("NEXT_PUBLIC_PROJECT_URL is not defined");
    }

    const socketInstance: SocketClientClientSideType = io(siteUrl, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });

    socketInstance.on("connect", () => {
      socketInstance.emit("testClientToServerEvent", "Test server to client connection event");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("testServerToClientEvent", (data) => {
      console.log(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export const useSocket = () => {
  return useContext(WebSocketContext);
}

export default WebSocketProvider