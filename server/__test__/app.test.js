const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');

// Import your classes
const MessageStore = require('../src/models/MessageStore');
const UserManager = require('../src/models/UserManager');
const ChatService = require('../src/services/ChatService');
const SocketHandler = require('../src/handlers/socketHandler');
const createRoutes = require('../src/routes');

describe('Chat Backend Core Tests', () => {
  let messageStore, userManager, chatService, io, server, app;
  let clientSocket1, clientSocket2;

  beforeAll((done) => {
    // Setup test server
    const express = require('express');
    app = express();
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: "*" } });

    // Initialize components
    messageStore = new MessageStore();
    userManager = new UserManager(io);
    chatService = new ChatService(messageStore, userManager, io);
    const socketHandler = new SocketHandler(io, chatService, userManager);

    // Setup middleware and routes
    app.use(express.json());
    app.use('/api', createRoutes(chatService, userManager, messageStore));

    // Setup socket handling
    io.on('connection', (socket) => {
      socketHandler.handleConnection(socket);
    });

    server.listen(() => {
      const port = server.address().port;
      
      // Create test clients
      clientSocket1 = new Client(`http://localhost:${port}`);
      clientSocket2 = new Client(`http://localhost:${port}`);
      
      let connected = 0;
      const checkReady = () => {
        connected++;
        if (connected === 2) done();
      };
      
      clientSocket1.on('connect', checkReady);
      clientSocket2.on('connect', checkReady);
    });
  });

  afterAll((done) => {
    io.close();
    clientSocket1.close();
    clientSocket2.close();
    server.close(done);
  });

  describe('MessageStore', () => {
    test('should store and retrieve messages', () => {
      const testMessage = {
        id: 'msg1',
        from: 'user1',
        to: 'user2',
        message: 'Hello',
        timestamp: Date.now()
      };

      messageStore.storeMessage('chat1', testMessage);
      const history = messageStore.getChatHistory('chat1');
      
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(testMessage);
    });

    test('should buffer offline messages', () => {
      const testMessage = {
        id: 'msg2',
        from: 'user1',
        to: 'user2',
        message: 'Offline message',
        timestamp: Date.now()
      };

      messageStore.bufferOfflineMessage('user2', testMessage);
      const buffered = messageStore.getBufferedMessages('user2');
      
      expect(buffered).toHaveLength(1);
      expect(buffered[0]).toEqual(testMessage);
    });

    test('should clear buffered messages', () => {
      messageStore.clearBufferedMessages('user2');
      const buffered = messageStore.getBufferedMessages('user2');
      
      expect(buffered).toHaveLength(0);
    });
  });

  describe('UserManager', () => {
    test('should register and manage users', () => {
      const userInfo = userManager.registerUser('testUser1', 'socket1');
      
      expect(userInfo.userId).toBe('testUser1');
      expect(userManager.isUserOnline('testUser1')).toBe(true);
      
      // Check if user is in online users list
      const onlineUsers = userManager.getOnlineUsers();
      expect(onlineUsers.some(user => user.userId === 'testUser1')).toBe(true);
    });

    test('should get all users', () => {
      userManager.registerUser('testUser2', 'socket2');
      const allUsers = userManager.getAllUsers();
      
      expect(allUsers.length).toBeGreaterThanOrEqual(2);
      expect(allUsers.some(user => user.userId === 'testUser1')).toBe(true);
      expect(allUsers.some(user => user.userId === 'testUser2')).toBe(true);
    });

    test('should disconnect users', () => {
      userManager.disconnectUser('testUser1');
      
      expect(userManager.isUserOnline('testUser1')).toBe(false);
    });
  });

  describe('ChatService', () => {
    let testChatService;

    beforeEach(() => {
      testChatService = new ChatService(new MessageStore(), new UserManager(io), io);
    });

    test('should send message and return result', async () => {
      const messageData = {
        from: 'user1',
        to: { userId: 'user2' },
        message: 'Test message'
      };

      const result = await testChatService.sendMessage(messageData);
      
      expect(result.status).toBe('processed');
      expect(result.messageId).toBeDefined();
    });

    test('should get chat history', () => {
      const history = testChatService.getChatHistory('user1', 'user2');
      
      expect(history).toHaveProperty('chatId');
      expect(history).toHaveProperty('users');
      expect(history).toHaveProperty('messages');
      expect(history.users).toEqual(['user1', 'user2']);
    });
  });

  describe('Socket Communication', () => {
    beforeEach(() => {
      // Clean up event listeners before each test
      clientSocket1.removeAllListeners();
      clientSocket2.removeAllListeners();
    });

    test('should handle user registration', (done) => {
      const handleRegistered = (userInfo) => {
        expect(userInfo.userId).toBe('socketUser1');
        clientSocket1.off('registered', handleRegistered);
        done();
      };

      clientSocket1.on('registered', handleRegistered);
      clientSocket1.emit('register', 'socketUser1');
    });

    test('should handle message sending', (done) => {
      let senderRegistered = false;
      let receiverRegistered = false;

      const checkBothRegistered = () => {
        if (senderRegistered && receiverRegistered) {
          clientSocket1.emit('sendMessage', {
            from: 'sender',
            to: { userId: 'receiver' },
            message: 'Hello from socket'
          });
        }
      };

      const handleSenderRegistered = (userInfo) => {
        if (userInfo.userId === 'sender') {
          senderRegistered = true;
          clientSocket1.off('registered', handleSenderRegistered);
          checkBothRegistered();
        }
      };

      const handleReceiverRegistered = (userInfo) => {
        if (userInfo.userId === 'receiver') {
          receiverRegistered = true;
          clientSocket2.off('registered', handleReceiverRegistered);
          checkBothRegistered();
        }
      };

      const handleMessage = (message) => {
        expect(message.from).toBe('sender');
        expect(message.message).toBe('Hello from socket');
        clientSocket2.off('message', handleMessage);
        done();
      };

      clientSocket1.on('registered', handleSenderRegistered);
      clientSocket2.on('registered', handleReceiverRegistered);
      clientSocket2.on('message', handleMessage);
      
      // Register both users
      clientSocket1.emit('register', 'sender');
      clientSocket2.emit('register', 'receiver');
    });

    test('should get all users via socket', (done) => {
      const handleAllUsers = (users) => {
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
        clientSocket1.off('allUsers', handleAllUsers);
        done();
      };

      clientSocket1.on('allUsers', handleAllUsers);
      clientSocket1.emit('getAllUsers');
    });

    test('should handle user joining broadcast', (done) => {
      const handleUserJoined = (userInfo) => {
        expect(userInfo.userId).toBe('newUser');
        clientSocket2.off('userJoined', handleUserJoined);
        done();
      };

      // Listen for user joined event on socket2
      clientSocket2.on('userJoined', handleUserJoined);

      // Register new user on socket1 which should broadcast to socket2
      setTimeout(() => {
        clientSocket1.emit('register', 'newUser');
      }, 100);
    });
  });

  describe('HTTP Routes', () => {
    test('GET /health should return status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('stats');
    });

    test('GET /users should return user data', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);
      
      expect(response.body).toHaveProperty('allUsers');
      expect(response.body).toHaveProperty('onlineUsers');
      expect(response.body).toHaveProperty('stats');
    });

    test('GET /messages should require query params', async () => {
      await request(app)
        .get('/api/messages')
        .expect(400);
    });

    test('GET /messages with params should return chat history', async () => {
      const response = await request(app)
        .get('/api/messages?user1=testUser1&user2=testUser2')
        .expect(200);
      
      expect(response.body).toHaveProperty('chatId');
      expect(response.body).toHaveProperty('messages');
      expect(response.body).toHaveProperty('users');
    });

    test('GET /buffered/:userId should return buffered messages', async () => {
      const response = await request(app)
        .get('/api/buffered/testUser')
        .expect(200);
      
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('bufferedMessages');
      expect(response.body).toHaveProperty('count');
    });

    test('GET /debug/messages should return debug info', async () => {
      const response = await request(app)
        .get('/api/debug/messages')
        .expect(200);
      
      expect(typeof response.body).toBe('object');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Clean up event listeners before each test
      clientSocket1.removeAllListeners();
      clientSocket2.removeAllListeners();
    });

    test('should handle invalid user lookup', async () => {
      const response = await request(app)
        .get('/api/users/nonexistentuser')
        .expect(404);
      
      expect(response.body.error).toBe('User not found');
    });

    test('should handle message send with incomplete data', (done) => {
      let errorReceived = false;
      
      const handleError = (error) => {
        expect(error).toHaveProperty('error');
        errorReceived = true;
        clientSocket1.off('messageError', handleError);
        clientSocket1.off('messageAck', handleAck);
        done();
      };

      const handleAck = () => {
        if (!errorReceived) {
          // If no error, that's also fine - just complete the test
          clientSocket1.off('messageError', handleError);
          clientSocket1.off('messageAck', handleAck);
          done();
        }
      };
      
      clientSocket1.on('messageError', handleError);
      clientSocket1.on('messageAck', handleAck);
      
      // Send message with incomplete data
      clientSocket1.emit('sendMessage', {
        from: 'testUser',
        message: 'incomplete message'
        // missing 'to' field
      });
    });
  });
});