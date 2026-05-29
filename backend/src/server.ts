import jwt from 'jsonwebtoken';
import { server, app } from './app';
import { initSocket } from './socket/index';
import env from './config/env';
import connectDB from './config/db';
import seedAdmin from './utils/seedAdmin';
import { SocketUser } from './types';
import { Socket } from 'socket.io';

interface SocketWithUser extends Socket {
  user?: SocketUser;
}

interface JwtPayload {
  id: string;
  role: string;
}

connectDB().then(() => {
  seedAdmin().catch((error: Error) => {
    console.error(`❌ Seed admin failed: ${error.message}`);
  });

  const io = initSocket(server, { clientUrl: env.CLIENT_URL });
  io.use((socket: SocketWithUser, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) return next(new Error('Unauthorized'));

      const token = (authHeader as string).startsWith('Bearer ')
        ? (authHeader as string).slice(7)
        : (authHeader as string);
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      socket.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (_error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    if (socket.user?.role === 'admin') {
      socket.join('admin');
    }
  });

  app.set('io', io);

  server.listen(env.PORT, () => {
    console.log(`🌿 Server đang chạy tại client url ${env.CLIENT_URL}`);
  });
}).catch((error: Error) => {
  console.error(`❌ Server startup failed: ${error.message}`);
  process.exit(1);
});
