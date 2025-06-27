const express = require('express');
const router = express.Router();

const createRoutes = (chatService, userManager, messageStore) => {
  
  // health check
  router.get('/health', (req, res) => {
    const onlineUsers = userManager.getOnlineUsers();
    const allUsers = userManager.getAllUsers();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      stats: {
        onlineUsers: onlineUsers.length,
        totalUsers: allUsers.length,
        totalChats: messageStore.messages.size
      }
    });
  });

  // user endpoints
  router.get('/users', (req, res) => {
    const allUsers = userManager.getAllUsers();
    const onlineUsers = userManager.getOnlineUsers();
    
    res.json({
      allUsers,
      onlineUsers,
      stats: {
        total: allUsers.length,
        online: onlineUsers.length,
        offline: allUsers.length - onlineUsers.length
      }
    });
  });

  router.get('/users/:userId', (req, res) => {
    const { userId } = req.params;
    const userInfo = userManager.getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userInfo);
  });

  // message endpoints
  router.get('/messages', (req, res) => {
    const { user1, user2 } = req.query;
    
    if (!user1 || !user2) {
      return res.status(400).json({ 
        error: 'Both user1 and user2 parameters are required' 
      });
    }
    
    const chatHistory = chatService.getChatHistory(user1, user2);
    res.json(chatHistory);
  });

  router.get('/chats', (req, res) => {
    const activeChats = messageStore.getAllChats();
    res.json({ activeChats });
  });

  // debug/admin endpoints
  router.get('/buffered/:userId', (req, res) => {
    const { userId } = req.params;
    const buffered = messageStore.getBufferedMessages(userId);
    
    res.json({
      userId,
      bufferedMessages: buffered,
      count: buffered.length
    });
  });

  router.delete('/messages', (req, res) => {
    const { user1, user2 } = req.query;
    
    if (!user1 || !user2) {
      return res.status(400).json({ 
        error: 'Both user1 and user2 parameters are required' 
      });
    }
    
    const chatId = require('../utils/helpers').generateChatId(user1, user2);
    messageStore.clearChat(chatId);
    
    res.json({ message: 'Chat cleared', chatId });
  });

  router.get('/debug/messages', (req, res) => {
    res.json(messageStore.getDebugInfo());
  });

  return router;
};

module.exports = createRoutes;
