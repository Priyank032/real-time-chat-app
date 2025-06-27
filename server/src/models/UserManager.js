const Logger = require('../utils/logger');
const { getCurrentTimestamp } = require('../utils/helpers');

class UserManager {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map();
    this.connectedUsers = new Map();
  }

  registerUser(userId, socketId) {
    this.userSockets.set(userId, socketId);
    const userInfo = this.updateUserStatus(userId, 'online');
    Logger.log('USER_REGISTERED', { userId, socketId, status: 'online' });
    return userInfo;
  }

  updateUserStatus(userId, status) {
    const userInfo = {
      userId,
      status,
      lastSeen: getCurrentTimestamp()
    };
    
    this.connectedUsers.set(userId, userInfo);
    Logger.log('USER_STATUS_UPDATED', userInfo);
    
    // broadcast to all users
    this.io.emit('userStatusUpdate', userInfo);
    
    return userInfo;
  }

  disconnectUser(userId) {
    const userInfo = this.updateUserStatus(userId, 'offline');
    this.userSockets.delete(userId);
    return userInfo;
  }

  getUserSocketId(userId) {
    return this.userSockets.get(userId);
  }

  isUserOnline(userId) {
    const user = this.connectedUsers.get(userId);
    return user && user.status === 'online';
  }

  getAllUsers() {
    return Array.from(this.connectedUsers.values());
  }

  getOnlineUsers() {
    return this.getAllUsers().filter(user => user.status === 'online');
  }

  getUserInfo(userId) {
    return this.connectedUsers.get(userId);
  }
}

module.exports = UserManager;