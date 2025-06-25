# Real-time Chat Application

A full-stack real-time chat application built with Node.js, Socket.IO, and React. Features include real-time messaging, user presence tracking, offline message buffering, and chat history persistence.

## Features

- **Real-time Messaging**: Instant message delivery using WebSockets
- **User Presence**: Track online/offline status of users
- **Offline Message Buffering**: Messages are stored and delivered when users come back online
- **Chat History**: Persistent message storage with REST API access
- **Typing Indicators**: See when someone is typing
- **User Management**: Registration, status tracking, and user lists
- **RESTful API**: HTTP endpoints for chat history and user management
- **Responsive UI**: Clean React-based interface with multiple views

## Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Socket.IO**: Real-time communication
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: User interface library
- **Socket.IO Client**: WebSocket client
- **CSS/HTML**: Styling and markup

## Project Structure

```
chat-app/
├── server/
│   ├── server.js          # Main server file
│   └── package.json       # Server dependencies
├── client/
│   ├── src/
│   │   ├── ChatApp.js     # Main React component
│   │   ├── ChatUI.js      # UI component router
│   │   └── views/         # View components
│   │       ├── RegisterView.js
│   │       ├── UserListView.js
│   │       └── ChatView.js
│   └── package.json       # Client dependencies
├── test/
│   └── demo.js           # Test/demo script
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Server Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install express socket.io cors
```

3. Start the server:
```bash
node server.js
```

The server will start on `http://localhost:3001`

### Client Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install react react-dom socket.io-client
```

3. Start the React development server:
```bash
npm start
```

The client will start on `http://localhost:3000`

## Usage

### Basic Flow

1. **Registration**: Enter a username to connect to the chat server
2. **User List**: View all users and their online/offline status
3. **Chat**: Select a user to start a conversation
4. **Real-time**: Messages are delivered instantly to online users
5. **Offline Support**: Messages are buffered and delivered when users come back online

### User Interface

#### Registration View
- Enter username
- Connect to server
- View connection logs

#### User List View
- See all registered users
- Online/offline status indicators
- Click to start chatting

#### Chat View
- Real-time messaging
- Message history
- Typing indicators
- Back to user list option

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and statistics.

### User Management
```
GET /users                    # Get all users with status
GET /users/:userId           # Get specific user status
PUT /users/:userId/status    # Update user status (testing)
```

### Chat History
```
GET /messages?user1=...&user2=...  # Get chat history between users
GET /chats                         # Get all active chats
DELETE /messages?user1=...&user2=... # Clear chat history
```

### Debug Endpoints
```
GET /buffered/:userId        # Get buffered messages for user
```

## Socket Events

### Client to Server
- `register` - Register user with server
- `sendMessage` - Send a message
- `typing` - Indicate user is typing
- `stopTyping` - Stop typing indication
- `getAllUsers` - Request all users list
- `getOnlineUsers` - Request online users list

### Server to Client
- `registered` - Registration confirmation
- `message` - Incoming message
- `messageAck` - Message delivery acknowledgment
- `userStatusUpdate` - User status changed
- `userJoined` - User came online
- `userLeft` - User went offline
- `userTyping` - Someone is typing
- `userStoppedTyping` - Stopped typing
- `allUsers` - List of all users
- `onlineUsers` - List of online users

## Testing

### Demo Script

Run the included demo script to test the chat functionality:

```bash
cd test
node demo.js
```

This will:
1. Create two test clients (Alice and Bob)
2. Send real-time messages
3. Test offline message buffering
4. Demonstrate reconnection and message delivery
5. Fetch chat history via REST API

### Manual Testing

1. Open multiple browser tabs/windows
2. Register different usernames
3. Test real-time messaging
4. Test offline scenarios by closing tabs
5. Verify message delivery when users reconnect

## Configuration

### Server Configuration

Default settings in `server.js`:
- **Port**: 3001 (configurable via `PORT` environment variable)
- **CORS Origin**: `http://localhost:3000`
- **Socket.IO Methods**: `["GET", "POST"]`

### Client Configuration

Update server URL in `ChatApp.js`:
```javascript
const connectedSocket = await connectToServer();
// Change the URL in connectToServer function if needed
const newSocket = io("http://localhost:3001", {
  timeout: 5000,
  forceNew: true,
});
```

## Data Storage

The application uses in-memory data structures:

- **messages**: `Map<chatId, Message[]>` - Chat history
- **userSockets**: `Map<userId, socketId>` - Socket mappings
- **offlineMessages**: `Map<userId, Message[]>` - Buffered messages
- **connectedUsers**: `Map<userId, UserInfo>` - User status tracking

> **Note**: Data is not persistent across server restarts. For production use, consider integrating with a database like MongoDB or PostgreSQL.

## Development

### Adding New Features

1. **Server-side**: Add socket event handlers in `server.js`
2. **Client-side**: Add event listeners and UI components
3. **API**: Add new REST endpoints for data access

### Debugging

- Enable logs display in the UI using the "Show Logs" toggle
- Check browser console for client-side errors
- Monitor server console for backend logs
- Use REST API endpoints to inspect data

## Production Considerations

- [ ] Replace in-memory storage with persistent database
- [ ] Add user authentication and authorization
- [ ] Implement rate limiting
- [ ] Add message encryption
- [ ] Set up proper error handling and logging
- [ ] Configure environment variables
- [ ] Add unit and integration tests
- [ ] Set up monitoring and health checks
- [ ] Implement horizontal scaling with Redis for Socket.IO

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if server is running on port 3001
   - Verify CORS configuration
   - Check firewall settings

2. **Messages Not Delivered**
   - Verify both users are registered
   - Check network connection
   - Review server logs for errors

3. **User Status Not Updating**
   - Check socket connection status
   - Verify event listeners are properly set up
   - Review client-side logs

### Debug Tools

- Browser Developer Tools (Network, Console tabs)
- Server logs in terminal
- REST API endpoints for data inspection
- Built-in logging system in the application

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review server and client logs
- Test with the demo script
- Open an issue on the repository
