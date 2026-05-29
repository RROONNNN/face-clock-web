import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

interface InitSocketOptions {
  clientUrl?: string;
}

export function initSocket(server: HttpServer, options: InitSocketOptions = {}): Server {
  ioInstance = new Server(server, {
    cors: {
      origin: options.clientUrl,
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket: Socket) => {
    socket.on('join-admin-room', () => {
      socket.join('admin');
    });
  });

  return ioInstance;
}

export function getIO(): Server | null {
  return ioInstance;
}
