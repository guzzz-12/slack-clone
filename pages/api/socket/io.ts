import { NextApiRequest } from "next";
import { Server as HttpServer } from "http";
import { Server as SocketSever } from "socket.io";
import { SocketApiResponse, SocketClientServerSideType, SocketServerType } from "@/types/socket";

const initializeSocketServer = (httpServer: HttpServer): SocketServerType => {
  const origin = process.env.NEXT_PUBLIC_PROJECT_URL!

  console.log({socketIO_Origin: origin});

  return new SocketSever(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {origin}
  });
};

// Route handler para inicializar el servidor de Socket.io
async function handler(_req: NextApiRequest, res: SocketApiResponse) {
  if (!res.socket.server.io) {
    const io = initializeSocketServer(res.socket.server);

    res.socket.server.io = io;

    io.emit("testServerToClientEvent", "testServerToClientEvent");

    // Eventos del servidor de Socket.io
    io.on("connection", (socket: SocketClientServerSideType) => {
      console.log(`Client connected: ${socket.id}`);
    });
  }

  res.end();
};

export default handler;