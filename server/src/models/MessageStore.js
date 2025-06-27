const Logger = require('../utils/logger');

class MessageStore {
  constructor() {
    this.messages = new Map();
    this.offlineMessages = new Map();
  }

  storeMessage(chatId, messageObj) {
    if (!this.messages.has(chatId)) {
      this.messages.set(chatId, []);
    }
    
    this.messages.get(chatId).push(messageObj);
    Logger.log('MESSAGE_STORED', { chatId, messageId: messageObj.id });
    
    return messageObj;
  }

  getChatHistory(chatId) {
    return this.messages.get(chatId) || [];
  }

  getAllChats() {
    const chats = [];
    this.messages.forEach((msgs, chatId) => {
      const [user1, user2] = chatId.split('-');
      chats.push({
        chatId,
        users: [user1, user2],
        messageCount: msgs.length,
        lastMessage: msgs[msgs.length - 1] || null
      });
    });
    return chats;
  }

  bufferOfflineMessage(userId, messageObj) {
    if (!this.offlineMessages.has(userId)) {
      this.offlineMessages.set(userId, []);
    }
    this.offlineMessages.get(userId).push(messageObj);
    Logger.log('MESSAGE_BUFFERED', { userId, messageId: messageObj.id });
  }

  getBufferedMessages(userId) {
    return this.offlineMessages.get(userId) || [];
  }

  clearBufferedMessages(userId) {
    this.offlineMessages.delete(userId);
  }

  clearChat(chatId) {
    this.messages.delete(chatId);
  }

  getDebugInfo() {
    const allMessages = {};
    this.messages.forEach((msgs, chatId) => {
      allMessages[chatId] = msgs;
    });
    
    return {
      totalChats: this.messages.size,
      chats: allMessages,
      chatIds: Array.from(this.messages.keys())
    };
  }
}

module.exports = MessageStore;
