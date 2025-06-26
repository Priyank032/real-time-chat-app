const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data structures (thread-safe using Map)
const messages = new Map(); // key: chatId, value: array of messages
const userSockets = new Map(); // key: userId, value: socket.id
const offlineMessages = new Map(); // key: userId, value: array of buffered messages
const connectedUsers = new Map(); // key: userId, value: { userId, status, lastSeen }

// Utility functions
const getChatId = (user1, user2) => {
  return [user1, user2].sort().join('-');
};

const log = (event, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${event}:`, data);
};

const updateUserStatus = (userId, status) => {
  const timestamp = new Date().toISOString();
  const userInfo = {
    userId,
    status, // 'online' or 'offline'
    lastSeen: timestamp
  };
  
  connectedUsers.set(userId, userInfo);
  log('USER_STATUS_UPDATED', userInfo);
  
  // Emit status update to all connected users
  io.emit('userStatusUpdate', userInfo);
  
  return userInfo;
};

const getAllUsers = () => {
  return Array.from(connectedUsers.values());
};

const getOnlineUsers = () => {
  return Array.from(connectedUsers.values()).filter(user => user.status === 'online');
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  let currentUser = null;
  
  log('CONNECTION', `Socket ${socket.id} connected`);

  // User registration
  socket.on('register', (userId) => {
    currentUser = userId;
    userSockets.set(userId, socket.id);
    
    // Update user status to online
    const userInfo = updateUserStatus(userId, 'online');
    
    log('USER_REGISTERED', { userId, socketId: socket.id, status: 'online' });
    
    // Deliver buffered offline messages
    if (offlineMessages.has(userId)) {
      const bufferedMessages = offlineMessages.get(userId);
      log('DELIVERING_OFFLINE_MESSAGES', { userId, count: bufferedMessages.length });
      
      bufferedMessages.forEach(msg => {
        socket.emit('message', msg);
        log('OFFLINE_MESSAGE_DELIVERED', { to: userId, message: msg });
      });
      
      // Clear buffered messages after delivery
      offlineMessages.delete(userId);
    }
    
    // Send registration acknowledgment with user info
    socket.emit('registered', userInfo);
    
    // Send current list of all users with their status
    socket.emit('allUsers', getAllUsers());
    
    // Notify all other users that this user joined (except the user themselves)
    socket.broadcast.emit('userJoined', userInfo);
  });

  // Get all users with their status
  socket.on('getAllUsers', () => {
    const allUsers = getAllUsers();
    socket.emit('allUsers', allUsers);
    log('ALL_USERS_REQUESTED', { requestedBy: currentUser, users: allUsers });
  });

  // Get only online users
  socket.on('getOnlineUsers', () => {
    const onlineUsers = getOnlineUsers();
    socket.emit('onlineUsers', onlineUsers);
    log('ONLINE_USERS_REQUESTED', { requestedBy: currentUser, users: onlineUsers });
  });

  // Handle incoming messages
  socket.on('sendMessage', (data) => {
    const { from, to, message } = data;
    const timestamp = new Date().toISOString();
    const messageId = Date.now() + Math.random().toString(36);
    
    const messageObj = {
      id: messageId,
      from,
      to,
      message,
      timestamp
    };

    // Store message in chat history using consistent chatId
    const chatId = getChatId(from, to.userId);
    console.log(`Storing message with chatId: ${chatId}`);
    
    if (!messages.has(chatId)) {
      messages.set(chatId, []);
      console.log(`Created new chat: ${chatId}`);
    }
    
    messages.get(chatId).push(messageObj);
    console.log(`Message stored. Total messages in ${chatId}: ${messages.get(chatId).length}`);
    
    log('MESSAGE_RECEIVED', { from, to, message, messageId });
    
    // Send acknowledgment to sender
    socket.emit('messageAck', { messageId, status: 'received' });
    
    // Check if recipient is online
    const recipientSocketId = userSockets.get(to.userId);
    const recipientUser = connectedUsers.get(to.userId);
    const isRecipientOnline = recipientUser && recipientUser.status === 'online';
    
    console.log(`Recipient ${to.userId} - SocketId: ${recipientSocketId}, Online: ${isRecipientOnline}`);
    
    if (isRecipientOnline && recipientSocketId) {
      // Deliver message in real-time
      io.to(recipientSocketId).emit('message', messageObj);
      log('MESSAGE_DELIVERED_REALTIME', { to, messageId });
    } else {
      // Buffer message for offline user
      if (!offlineMessages.has(to.userId)) {
        offlineMessages.set(to.userId, []);
      }
      offlineMessages.get(to.userId).push(messageObj);
      log('MESSAGE_BUFFERED', { to: to.userId, messageId, reason: 'user_offline' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (currentUser) {
      // Update user status to offline
      const userInfo = updateUserStatus(currentUser, 'offline');
      
      // Remove from socket mapping
      userSockets.delete(currentUser);
      
      // Notify all other users that this user left
      socket.broadcast.emit('userLeft', userInfo);
      
      log('USER_DISCONNECTED', { userId: currentUser, socketId: socket.id, status: 'offline' });
    } else {
      log('DISCONNECTION', `Socket ${socket.id} disconnected (unregistered user)`);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { from, to } = data;
    const recipientSocketId = userSockets.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('userTyping', { userId: from });
    }
  });

  socket.on('stopTyping', (data) => {
    const { from, to } = data;
    const recipientSocketId = userSockets.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('userStoppedTyping', { userId: from });
    }
  });
});

// REST API Routes

// Health check
app.get('/health', (req, res) => {
  const onlineUsers = getOnlineUsers();
  const allUsers = getAllUsers();
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    onlineUsers: onlineUsers.length,
    totalUsers: allUsers.length,
    users: allUsers,
    totalChats: messages.size
  });
});

// Get all users with their status
app.get('/users', (req, res) => {
  const allUsers = getAllUsers();
  const onlineUsers = getOnlineUsers();
  
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

// Get specific user status
app.get('/users/:userId', (req, res) => {
  const { userId } = req.params;
  const userInfo = connectedUsers.get(userId);
  
  if (!userInfo) {
    return res.status(404).json({ 
      error: 'User not found',
      userId 
    });
  }
  
  res.json(userInfo);
});

// Get chat history between two users
app.get('/messages', (req, res) => {
  const { user1, user2 } = req.query;
  
  console.log(`Chat history request - user1: ${user1}, user2: ${user2}`);
  
  if (!user1 || !user2) {
    return res.status(400).json({ 
      error: 'Both user1 and user2 parameters are required' 
    });
  }
  
  const chatId = getChatId(user1, user2);
  console.log(`Looking for chatId: ${chatId}`);
  console.log(`Available chats:`, Array.from(messages.keys()));
  
  const chatHistory = messages.get(chatId) || [];
  
  console.log(`Found ${chatHistory.length} messages for chat ${chatId}`);
  
  log('CHAT_HISTORY_REQUESTED', { user1, user2, chatId, messageCount: chatHistory.length });
  
  res.json({
    chatId,
    users: [user1, user2],
    messages: chatHistory,
    totalMessages: chatHistory.length
  });
});

// Get all active chats
app.get('/chats', (req, res) => {
  const activeChats = [];
  messages.forEach((msgs, chatId) => {
    const [user1, user2] = chatId.split('-');
    activeChats.push({
      chatId,
      users: [user1, user2],
      messageCount: msgs.length,
      lastMessage: msgs[msgs.length - 1] || null
    });
  });
  
  res.json({ activeChats });
});

// Get buffered messages for a user (for debugging)
app.get('/buffered/:userId', (req, res) => {
  const { userId } = req.params;
  const buffered = offlineMessages.get(userId) || [];
  
  res.json({
    userId,
    bufferedMessages: buffered,
    count: buffered.length
  });
});

// Clear chat history (for testing)
app.delete('/messages', (req, res) => {
  const { user1, user2 } = req.query;
  
  if (!user1 || !user2) {
    return res.status(400).json({ 
      error: 'Both user1 and user2 parameters are required' 
    });
  }
  
  const chatId = getChatId(user1, user2);
  messages.delete(chatId);
  
  log('CHAT_HISTORY_CLEARED', { user1, user2, chatId });
  
  res.json({ 
    message: 'Chat history cleared successfully',
    chatId 
  });
});

// Manually update user status (for testing)
app.put('/users/:userId/status', (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  
  if (!['online', 'offline'].includes(status)) {
    return res.status(400).json({ 
      error: 'Status must be either "online" or "offline"' 
    });
  }
  
  const userInfo = updateUserStatus(userId, status);
  
  res.json({
    message: 'User status updated successfully',
    user: userInfo
  });
});

// Debug endpoint to see all stored messages
app.get('/debug/messages', (req, res) => {
  const allMessages = {};
  messages.forEach((msgs, chatId) => {
    allMessages[chatId] = msgs;
  });
  
  res.json({
    totalChats: messages.size,
    chats: allMessages,
    chatIds: Array.from(messages.keys())
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 REST API available at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Users endpoint: http://localhost:${PORT}/users`);
  console.log(`🐛 Debug messages: http://localhost:${PORT}/debug/messages`);
});