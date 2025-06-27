# Real-time Chat Application

A production-ready, full-stack real-time chat application built with React, Node.js, Express, and Socket.IO. Experience seamless real-time messaging with advanced features like user presence tracking, offline message delivery, and persistent chat history.

## 🎥 Demo Video

[![Chat Application Demo](https://img.shields.io/badge/▶️%20Watch%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://drive.google.com/file/d/15v5CLLGOouX5-frcGlnShqFjCj3HWdGy/view?usp=sharing)

*Click above to watch the full application demo showcasing real-time messaging, user status tracking, and offline message handling*

## 🚀 Features

### Core Messaging
- **⚡ Real-time messaging** - Instant message delivery using WebSocket technology
- **💬 Chat history** - Persistent message storage with REST API integration
- **📱 Cross-platform** - Works seamlessly on desktop and mobile browsers
- **🔄 Message acknowledgments** - Confirmation of successful message delivery

### User Experience
- **👥 User presence** - Real-time online/offline status with "last seen" timestamps
- **📫 Offline messaging** - Messages automatically delivered when users come back online
- **🎨 Modern UI** - Clean, responsive Material-UI design with intuitive navigation
- **⚙️ Connection management** - Automatic reconnection with graceful error handling

### Advanced Features
- **📊 Activity logs** - Real-time monitoring and debugging capabilities
- **🔍 User discovery** - Browse all users with their current status
- **🚀 Performance optimized** - Efficient message routing and state management
- **🛡️ Error resilience** - Robust handling of network interruptions and failures

## 📋 System Architecture

### Backend Components

1. **MessageStore** - In-memory storage for chat messages and offline message buffering
2. **UserManager** - Manages user registration, status tracking, and socket connections
3. **ChatService** - Handles message routing, delivery, and chat history retrieval
4. **SocketHandler** - Manages Socket.IO connections and real-time events
5. **REST API** - Provides endpoints for chat history retrieval

### Frontend Components

1. **ChatApp** - Main application container with Socket.IO integration
2. **ChatUI** - UI router component managing different views
3. **RegisterView** - User registration interface
4. **UserListView** - Display all users with online/offline status
5. **ChatView** - Real-time chat interface

## 🔧 How System Handles Functional Requirements

### 1. Real-time Chat Between Two Users

**Implementation:**
- Uses Socket.IO for WebSocket-based real-time communication
- Messages are instantly delivered to online recipients via `socket.emit('message', messageObj)`
- Each message includes unique ID, timestamp, sender, recipient, and content
- Message acknowledgments confirm successful delivery

**Key Components:**
```javascript
// Client sends message
socket.emit("sendMessage", { from: user1, to: user2, message: "Hello!" });

// Server processes and delivers
await chatService.sendMessage(data);
socket.emit('messageAck', result);
```

### 2. User Status Tracking (Online/Offline)

**Implementation:**
- UserManager tracks all user connections and status changes
- Real-time status updates broadcast to all connected clients
- LastSeen timestamps recorded for offline users
- Visual indicators (green dot for online, last seen time for offline)

**Key Features:**
```javascript
// Status update broadcast
updateUserStatus(userId, status) {
  const userInfo = { userId, status, lastSeen: getCurrentTimestamp() };
  this.io.emit('userStatusUpdate', userInfo);
}
```

### 3. Offline Message Handling

**Implementation:**
- Messages to offline users are buffered in MessageStore
- When user reconnects, all buffered messages are delivered automatically
- Buffered messages cleared after successful delivery

**Process Flow:**
```javascript
// Buffer message for offline user
if (!this.userManager.isUserOnline(to.userId)) {
  this.messageStore.bufferOfflineMessage(to.userId, messageObj);
}

// Deliver on reconnection
this.chatService.deliverOfflineMessages(userId, socket);
```

### 4. Chat History Persistence

**Implementation:**
- All messages stored in-memory with unique chat IDs
- REST API endpoint provides chat history retrieval
- Messages persist during server runtime
- Chat history loaded when starting new conversations

**API Endpoint:**
```
GET /messages?user1=alice&user2=bob
```

### 5. Connection State Management

**Implementation:**
- Automatic connection retry with exponential backoff
- Connection state tracking (connecting, connected, disconnected)
- Graceful handling of network interruptions
- User session restoration on reconnection

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (>=16.0.0)
- npm or yarn

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start development server
npm run dev
# or for production
npm start
```

### Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📖 Usage Examples

### 1. Real-time Chat Between Two Users

**Step 1: Register First User**
```bash
# Open browser tab 1
# Navigate to http://localhost:3000
# Enter username "Alice"
# Click "Connect & Register"
```

**Step 2: Register Second User**
```bash
# Open browser tab 2 (incognito/different browser)
# Navigate to http://localhost:3000
# Enter username "Bob"
# Click "Connect & Register"
```

**Step 3: Start Chat**
```bash
# In Alice's browser:
# - Click on "Bob" from user list
# - Type message: "Hello Bob!"
# - Press Enter or click Send

# In Bob's browser:
# - Message appears instantly in real-time
# - Bob can reply: "Hi Alice!"
# - Conversation continues in real-time
```

**Expected Behavior:**
- Messages appear instantly without page refresh
- Timestamps and message delivery confirmations
- Typing indicators (if implemented)
- Message history preserved during session

### 2. Handling Disconnection and Reconnection

**Scenario Setup:**
```bash
# Start chat between Alice and Bob (as above)
# Simulate Alice going offline
```

**Step 1: Simulate Disconnection**
```bash
# In Alice's browser:
# - Close browser tab or disable network
# In Bob's browser:
# - Alice's status changes to "offline"
# - Shows "Last seen X minutes ago"
```

**Step 2: Send Messages to Offline User**
```bash
# In Bob's browser (Alice is offline):
# - Send message: "Are you there Alice?"
# - Send message: "I'll wait for you"
# - Messages are buffered on server
```

**Step 3: Reconnection**
```bash
# Open new browser tab for Alice
# Navigate to http://localhost:3000
# Register as "Alice" again
```

**Expected Behavior:**
- Alice receives all buffered messages immediately upon reconnection
- Bob sees Alice's status change to "online"
- Chat history is preserved
- Normal real-time communication resumes

**Test Script:**
```javascript
// You can test this programmatically
const socket1 = io('http://localhost:3001');
const socket2 = io('http://localhost:3001');

// Register users
socket1.emit('register', 'TestUser1');
socket2.emit('register', 'TestUser2');

// Disconnect one user
socket1.disconnect();

// Send message to offline user
socket2.emit('sendMessage', {
  from: 'TestUser2',
  to: { userId: 'TestUser1' },
  message: 'Offline message test'
});

// Reconnect and check message delivery
socket1.connect();
socket1.emit('register', 'TestUser1');
```

### 3. Retrieving Chat History via REST API

**Direct API Testing:**
```bash
# Using curl
curl "http://localhost:3001/messages?user1=Alice&user2=Bob"

# Using browser
# Navigate to: http://localhost:3001/messages?user1=Alice&user2=Bob
```

**Expected Response:**
```json
{
  "chatId": "Alice-Bob",
  "users": ["Alice", "Bob"],
  "messages": [
    {
      "id": "msg_1640995200000_abc123",
      "from": "Alice",
      "to": "Bob",
      "message": "Hello Bob!",
      "timestamp": "2024-01-01T10:00:00.000Z"
    },
    {
      "id": "msg_1640995260000_def456",
      "from": "Bob",
      "to": "Alice",
      "message": "Hi Alice!",
      "timestamp": "2024-01-01T10:01:00.000Z"
    }
  ],
  "totalMessages": 2
}
```

**Frontend Integration:**
```javascript
// Chat history is automatically loaded when starting a conversation
const fetchChatHistory = async (targetUser) => {
  const res = await fetch(
    `http://localhost:3001/messages?user1=${currentUser}&user2=${targetUser}`
  );
  const data = await res.json();
  // Messages displayed in chat interface
};
```

**Testing Different Scenarios:**
```bash
# Test with no chat history
curl "http://localhost:3001/messages?user1=NewUser1&user2=NewUser2"
# Returns: {"messages": [], "totalMessages": 0}

# Test with existing conversation
curl "http://localhost:3001/messages?user1=Alice&user2=Bob"
# Returns: Complete message history

# Test reverse user order (should return same chat)
curl "http://localhost:3001/messages?user1=Bob&user2=Alice"
# Returns: Same conversation (normalized chat ID)
```

## 🔍 Debugging & Monitoring

### Activity Logs
The application includes comprehensive logging:
- Connection/disconnection events
- Message sending/delivery
- User status changes
- Error tracking

### Log Viewer
Access logs through the UI:
```bash
# In any view of the application
# Click "Show Logs" button
# View real-time activity logs
```

### Server-side Debugging
```bash
# Enable detailed logging
DEBUG=* npm run dev

# Or check specific components
DEBUG=socket.io:* npm run dev
```

## 🚀 Production Deployment

### Docker Support
```bash
# Build and run with Docker
npm run docker:build
npm run docker:run
```

### Environment Variables
```bash
# Server configuration
PORT=3001
NODE_ENV=production

# Frontend configuration  
REACT_APP_SERVER_URL=http://localhost:3001
```

## 🧪 Testing

### Automated Tests
```bash
# Run backend tests
cd server && npm test

# Run frontend tests  
cd client && npm test
```

### Manual Testing Checklist
- [ ] User registration and connection
- [ ] Real-time message delivery
- [ ] Status tracking (online/offline)
- [ ] Offline message buffering
- [ ] Chat history retrieval
- [ ] Connection recovery
- [ ] Multiple user support
- [ ] UI responsiveness

## 📝 API Documentation

### Socket.IO Events

**Client to Server:**
- `register(userId)` - Register user and establish connection
- `sendMessage(data)` - Send message to another user
- `getAllUsers()` - Request complete user list
- `typing(data)` - Send typing indicator
- `disconnect()` - Graceful disconnection

**Server to Client:**
- `registered(userInfo)` - Confirm user registration
- `message(messageObj)` - Receive new message
- `userStatusUpdate(userInfo)` - User status changed
- `userJoined(userInfo)` - New user joined
- `userLeft(userInfo)` - User disconnected
- `messageAck(result)` - Message delivery confirmation

### REST Endpoints

```
GET /messages?user1={userId1}&user2={userId2}
Response: Chat history between two users

GET /health
Response: Server health status
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`  
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔧 Troubleshooting

### Common Issues

**Connection Failed:**
```bash
# Check if backend server is running
curl http://localhost:3001/health

# Verify port availability
lsof -i :3001
```

**Messages Not Delivering:**
```bash
# Check Socket.IO connection
# Open browser developer tools
# Look for WebSocket connection in Network tab
```

**Chat History Not Loading:**
```bash
# Test REST API directly
curl "http://localhost:3001/messages?user1=test1&user2=test2"
```

### Performance Optimization

For production use, consider:
- Implementing Redis for scalable message storage
- Adding database persistence (MongoDB/PostgreSQL)
- Load balancing for multiple server instances
- Message pagination for large chat histories
- CDN for static asset delivery

---

Built with ❤️ using React, Node.js, Express, and Socket.IO