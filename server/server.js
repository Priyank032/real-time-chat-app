const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const config = require('./src/config');
const Logger = require('./src/utils/logger');
const MessageStore = require('./src/models/MessageStore');
const UserManager = require('./src/models/UserManager');
const ChatService = require('./src/services/ChatService');
const SocketHandler = require('./src/handlers/socketHandler');
const createRoutes = require('./src/routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: config.cors });

// middleware
app.use(cors());
app.use(express.json());

// initialize core components
const messageStore = new MessageStore();
const userManager = new UserManager(io);
const chatService = new ChatService(messageStore, userManager, io);
const socketHandler = new SocketHandler(io, chatService, userManager);

// setup socket handling
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// setup routes
app.use('/api', createRoutes(chatService, userManager, messageStore));

// basic routes for backwards compatibility
app.use('/', createRoutes(chatService, userManager, messageStore));

server.listen(config.port, () => {
  Logger.log('SERVER_STARTED', {
    port: config.port,
    env: config.env,
    endpoints: [
      `http://localhost:${config.port}/health`,
      `http://localhost:${config.port}/users`,
      `http://localhost:${config.port}/debug/messages`
    ]
  });
});

module.exports = { app, server };
