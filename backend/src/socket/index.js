let ioInstance = null;

function initSocket(server, options = {}) {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: options.clientUrl,
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join-admin-room', () => {
      socket.join('admin');
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocket, getIO };
