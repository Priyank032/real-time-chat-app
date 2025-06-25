const io = require('socket.io-client');

// Test script to demonstrate chat functionality
class ChatClient {
  constructor(userId, serverUrl = 'http://localhost:3001') {
    this.userId = userId;
    this.socket = io(serverUrl);
    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log(`[${this.userId}] Connected to server`);
      this.socket.emit('register', this.userId);
    });

    this.socket.on('registered', (data) => {
      console.log(`[${this.userId}] Registered successfully:`, data);
    });

    this.socket.on('message', (message) => {
      console.log(`[${this.userId}] Received message:`, {
        from: message.from,
        message: message.message,
        timestamp: message.timestamp
      });
    });

    this.socket.on('messageAck', (ack) => {
      console.log(`[${this.userId}] Message acknowledged:`, ack);
    });

    this.socket.on('userTyping', (data) => {
      console.log(`[${this.userId}] ${data.userId} is typing...`);
    });

    this.socket.on('userStoppedTyping', (data) => {
      console.log(`[${this.userId}] ${data.userId} stopped typing`);
    });

    this.socket.on('disconnect', () => {
      console.log(`[${this.userId}] Disconnected from server`);
    });
  }

  sendMessage(to, message) {
    console.log(`[${this.userId}] Sending message to ${to}: "${message}"`);
    this.socket.emit('sendMessage', {
      from: this.userId,
      to: to,
      message: message
    });
  }

  startTyping(to) {
    this.socket.emit('typing', { from: this.userId, to: to });
  }

  stopTyping(to) {
    this.socket.emit('stopTyping', { from: this.userId, to: to });
  }

  disconnect() {
    console.log(`[${this.userId}] Manually disconnecting...`);
    this.socket.disconnect();
  }

  reconnect() {
    console.log(`[${this.userId}] Reconnecting...`);
    this.socket.connect();
  }
}

// Demo script
async function runDemo() {
  console.log('🚀 Starting Chat Demo\n');

  // Create two clients
  const alice = new ChatClient('Alice');
  const bob = new ChatClient('Bob');

  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n📝 Phase 1: Real-time messaging');
  alice.sendMessage('Bob', 'Hello Bob! How are you?');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  bob.sendMessage('Alice', 'Hi Alice! I\'m doing great, thanks!');

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n🔌 Phase 2: Disconnection and offline messages');
  bob.disconnect();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Sending messages to offline Bob...');
  alice.sendMessage('Bob', 'Are you there?');
  alice.sendMessage('Bob', 'I guess you went offline');
  alice.sendMessage('Bob', 'I\'ll wait for you to come back');

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🔄 Phase 3: Reconnection and message delivery');
  bob.reconnect();

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n📊 Phase 4: Chat history retrieval');
  try {
    const response = await fetch('http://localhost:3001/messages?user1=Alice&user2=Bob');
    const data = await response.json();
    console.log('Chat history:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error fetching chat history:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n✅ Demo completed. Disconnecting clients...');
  alice.disconnect();
  bob.disconnect();
}

// Run demo if this script is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { ChatClient };