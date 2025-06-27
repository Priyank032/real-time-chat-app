const Logger = require('../utils/logger');

class SocketHandler {
  constructor(io, chatService, userManager) {
    this.io = io;
    this.chatService = chatService;
    this.userManager = userManager;
  }

  handleConnection(socket) {
    let currentUser = null;
    Logger.log('CONNECTION', `Socket ${socket.id} connected`);

    socket.on('register', (userId) => {
      currentUser = userId;
      const userInfo = this.userManager.registerUser(userId, socket.id);
      
      // deliver any offline messages
      this.chatService.deliverOfflineMessages(userId, socket);
      
      socket.emit('registered', userInfo);
      socket.emit('allUsers', this.userManager.getAllUsers());
      socket.broadcast.emit('userJoined', userInfo);
    });

    socket.on('getAllUsers', () => {
      const allUsers = this.userManager.getAllUsers();
      socket.emit('allUsers', allUsers);
      Logger.log('ALL_USERS_REQUESTED', { requestedBy: currentUser, count: allUsers.length });
    });

    socket.on('getOnlineUsers', () => {
      const onlineUsers = this.userManager.getOnlineUsers();
      socket.emit('onlineUsers', onlineUsers);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const result = await this.chatService.sendMessage(data);
        socket.emit('messageAck', result);
      } catch (error) {
        Logger.error('SEND_MESSAGE_ERROR', error, { data });
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // socket.on('typing', (data) => {
    //   const { from, to } = data;
    //   const recipientSocketId = this.userManager.getUserSocketId(to);
    //   if (recipientSocketId) {
    //     this.io.to(recipientSocketId).emit('userTyping', { userId: from });
    //   }
    // });

    // socket.on('stopTyping', (data) => {
    //   const { from, to } = data;
    //   const recipientSocketId = this.userManager.getUserSocketId(to);
    //   if (recipientSocketId) {
    //     this.io.to(recipientSocketId).emit('userStoppedTyping', { userId: from });
    //   }
    // });

    socket.on('disconnect', () => {
      if (currentUser) {
        const userInfo = this.userManager.disconnectUser(currentUser);
        socket.broadcast.emit('userLeft', userInfo);
        Logger.log('USER_DISCONNECTED', { userId: currentUser, socketId: socket.id });
      }
    });
  }
}

module.exports = SocketHandler;