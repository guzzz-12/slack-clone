import { NextApiResponse } from "next";
import { Server as HttpServer } from "http";
import { Socket as NetSocket } from "net";
import { Socket as SocketClientServerSide, Server as SocketServer } from "socket.io";
import { Socket as SocketClientClientSide } from "socket.io-client";
import { MessageWithSender } from "./supabase";

/** Eventos del servidor de Socket.io */
export interface ServerToClientEvents {
  testServerToClientEvent: (data: string) => void;
  [channelKey: `channel:${string}:message`]: (message: MessageWithSender) => void;
  [userKey: `private:${string}:message`]: (message: any) => void;
  deletedChannelMessage: (message: any) => void;
  deletedPrivateMessage: (message: any) => void;
}

/** Eventos del cliente de Socket.io */
export interface ClientToServerEvents {
  testClientToServerEvent: (data: string) => void;
  [channelKey: `channel:${string}:message`]: (message: MessageWithSender) => void;
  [userKey: `private:${string}:message`]: (message: any) => void;
  deletedChannelMessage: (message: any) => void;
  deletedPrivateMessage: (message: any) => void;
}

/** Tipado del servidor de Socket.io */
export type SocketServerType = SocketServer<ClientToServerEvents, ServerToClientEvents>;

/** Tipado del cliente de Socket.io en el lado del cliente */
export type SocketClientClientSideType = SocketClientClientSide<ServerToClientEvents, ClientToServerEvents>;

/** Tipado del cliente de Socket.io en el lado del servidor */
export type SocketClientServerSideType = SocketClientServerSide<ClientToServerEvents, ServerToClientEvents>;

export type SocketApiResponse = NextApiResponse & {
  socket: NetSocket & {
    server: HttpServer & {
      io: SocketServerType;
    };
  }
}