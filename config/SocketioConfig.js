const socketIo = require('socket.io');
const MessageModel = require('../model/schema');

module.exports = function (server) {
  const io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join room', (userId) => {
      socket.join(userId);
      console.log(`User ${socket.id} joined room ${userId}`);
    });

    socket.on('chat message', async ({ toUserId, msg, fromUserId }) => {
      const message = new Message({
        senderId: fromUserId,
        recipientId: toUserId,
        content: msg,
      });
      await message.save();
      io.to(toUserId).emit('chat message', msg);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};