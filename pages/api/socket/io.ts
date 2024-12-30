import { NextApiRequest } from "next";
import { Server as NetServer } from "http";
import { Server as SocketSever } from "socket.io";
import { SocketApiResponse, SocketClientServerSideType, SocketServerType } from "@/types/socket";

const initializeSocketServer = (httpServer: NetServer): SocketServerType => {;
  return new SocketSever(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_PROJECT_URL,
    }
  });
};

// Route handler para inicializar el servidor de Socket.io
export default async function (_req: NextApiRequest, res: SocketApiResponse) {
  if (!res.socket.server.io) {
    const io = initializeSocketServer(res.socket.server.io);

    res.socket.server.io = io;

    io.emit("testServerToClientEvent", "testServerToClientEvent");

    // Eventos del servidor de Socket.io
    io.on("connection", (socket: SocketClientServerSideType) => {
      console.log(`Client connected: ${socket.id}`);
    });
  }

  res.end();
};