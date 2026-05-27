'use strict';

const jwt = require('jsonwebtoken');
const { server } = require('./app');
const { initSocket } = require('./socket/index');
const env = require('./config/env');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

connectDB().then(() => {
  seedAdmin().catch((error) => {
    console.error(`❌ Seed admin failed: ${error.message}`);
  });

  const io = initSocket(server, { clientUrl: env.CLIENT_URL });
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) return next(new Error('Unauthorized'));

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.role === 'admin') {
      socket.join('admin');
    }
  });

  const { app } = require('./app');
  app.set('io', io);

  server.listen(env.PORT, () => {
    console.log(`🌿 Server đang chạy tại client url ${env.CLIENT_URL}`);
  });
}).catch((error) => {
  console.error(`❌ Server startup failed: ${error.message}`);
  process.exit(1);
});
