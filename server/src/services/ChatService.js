const Logger = require('../utils/logger');
const { generateChatId, generateMessageId, getCurrentTimestamp } = require('../utils/helpers');

class ChatService {
  constructor(messageStore, userManager, io) {
    this.messageStore = messageStore;
    this.userManager = userManager;
    this.io = io;
  }

  async sendMessage(data) {
    const { from, to, message } = data;
    const messageId = generateMessageId();
    
    const messageObj = {
      id: messageId,
      from,
      to,
      message,
      timestamp: getCurrentTimestamp()
    };

    const chatId = generateChatId(from, to.userId);
    this.messageStore.storeMessage(chatId, messageObj);
    
    Logger.log('MESSAGE_RECEIVED', { from, to: to.userId, messageId });
    
    // check if recipient is online and deliver
    if (this.userManager.isUserOnline(to.userId)) {
      const recipientSocketId = this.userManager.getUserSocketId(to.userId);
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('message', messageObj);
        Logger.log('MESSAGE_DELIVERED', { to: to.userId, messageId });
      }
    } else {
      this.messageStore.bufferOfflineMessage(to.userId, messageObj);
    }
    
    return { messageId, status: 'processed' };
  }

  deliverOfflineMessages(userId, socket) {
    const bufferedMessages = this.messageStore.getBufferedMessages(userId);
    
    if (bufferedMessages.length > 0) {
      Logger.log('DELIVERING_OFFLINE_MESSAGES', { userId, count: bufferedMessages.length });
      
      bufferedMessages.forEach(msg => {
        socket.emit('message', msg);
      });
      
      this.messageStore.clearBufferedMessages(userId);
    }
  }

  getChatHistory(user1, user2) {
    const chatId = generateChatId(user1, user2);
    const messages = this.messageStore.getChatHistory(chatId);
    
    Logger.log('CHAT_HISTORY_REQUESTED', { user1, user2, chatId, messageCount: messages.length });
    
    return {
      chatId,
      users: [user1, user2],
      messages,
      totalMessages: messages.length
    };
  }
}

module.exports = ChatService;
