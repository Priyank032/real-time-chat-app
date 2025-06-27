const io = require('socket.io-client');
const fetch = require('node-fetch'); // Make sure to install: npm install node-fetch

// Enhanced test client with more comprehensive event handling
class ChatClient {
  constructor(userId, serverUrl = 'http://localhost:3001') {
    this.userId = userId;
    this.serverUrl = serverUrl;
    this.socket = io(serverUrl);
    this.messages = [];
    this.events = [];
    this.isRegistered = false;
    this.setupListeners();
  }

  setupListeners() {
    // Connection events
    this.socket.on('connect', () => {
      this.log('Connected to server');
      // Auto-register on connection
      this.socket.emit('register', this.userId);
    });

    this.socket.on('disconnect', (reason) => {
      this.log(`Disconnected: ${reason}`);
      this.isRegistered = false;
    });

    // Registration events
    this.socket.on('registered', (data) => {
      this.log('Registered successfully:', data);
      this.isRegistered = true;
      this.events.push({ type: 'registered', data, timestamp: new Date() });
    });

    // Message events
    this.socket.on('message', (message) => {
      this.log('Received message:', {
        from: message.from,
        message: message.message,
        timestamp: message.timestamp
      });
      this.messages.push(message);
      this.events.push({ type: 'message_received', data: message, timestamp: new Date() });
    });

    this.socket.on('messageAck', (ack) => {
      this.log('Message acknowledged:', ack);
      this.events.push({ type: 'message_ack', data: ack, timestamp: new Date() });
    });

    // User status events
    this.socket.on('userStatusUpdate', (userInfo) => {
      this.log('User status updated:', userInfo);
      this.events.push({ type: 'user_status_update', data: userInfo, timestamp: new Date() });
    });

    this.socket.on('userJoined', (userInfo) => {
      this.log('User joined:', userInfo);
      this.events.push({ type: 'user_joined', data: userInfo, timestamp: new Date() });
    });

    this.socket.on('userLeft', (userInfo) => {
      this.log('User left:', userInfo);
      this.events.push({ type: 'user_left', data: userInfo, timestamp: new Date() });
    });

    // User list events
    this.socket.on('allUsers', (users) => {
      this.log('All users:', users);
      this.events.push({ type: 'all_users', data: users, timestamp: new Date() });
    });

    this.socket.on('onlineUsers', (users) => {
      this.log('Online users:', users);
      this.events.push({ type: 'online_users', data: users, timestamp: new Date() });
    });

    // Typing indicators
    this.socket.on('userTyping', (data) => {
      this.log(`${data.userId} is typing...`);
      this.events.push({ type: 'user_typing', data, timestamp: new Date() });
    });

    this.socket.on('userStoppedTyping', (data) => {
      this.log(`${data.userId} stopped typing`);
      this.events.push({ type: 'user_stopped_typing', data, timestamp: new Date() });
    });

    // Error handling
    this.socket.on('connect_error', (error) => {
      this.log('Connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      this.log('Socket error:', error);
    });
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [${this.userId}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [${this.userId}] ${message}`);
    }
  }

  // Wait for registration to complete
  async waitForRegistration(timeout = 5000) {
    const start = Date.now();
    while (!this.isRegistered && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!this.isRegistered) {
      throw new Error(`Registration timeout for ${this.userId}`);
    }
  }

  // Send message with recipient object format
  sendMessage(toUserId, message) {
    this.log(`Sending message to ${toUserId}: "${message}"`);
    this.socket.emit('sendMessage', {
      from: this.userId,
      to: { userId: toUserId }, // Updated to match server expectation
      message: message
    });
  }

  // Request all users
  getAllUsers() {
    this.socket.emit('getAllUsers');
  }

  // Request online users
  getOnlineUsers() {
    this.socket.emit('getOnlineUsers');
  }

  // Typing indicators
  startTyping(toUserId) {
    this.socket.emit('typing', { from: this.userId, to: toUserId });
  }

  stopTyping(toUserId) {
    this.socket.emit('stopTyping', { from: this.userId, to: toUserId });
  }

  // Connection management
  disconnect() {
    this.log('Manually disconnecting...');
    this.socket.disconnect();
  }

  reconnect() {
    this.log('Reconnecting...');
    this.socket.connect();
  }

  // Get client statistics
  getStats() {
    return {
      userId: this.userId,
      isConnected: this.socket.connected,
      isRegistered: this.isRegistered,
      messagesReceived: this.messages.length,
      eventsRecorded: this.events.length
    };
  }

  // Clear recorded data
  clearData() {
    this.messages = [];
    this.events = [];
  }
}

// API Helper functions
class ApiHelper {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async put(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}

// Test Suite
class ChatTestSuite {
  constructor() {
    this.api = new ApiHelper();
    this.clients = new Map();
    this.testResults = [];
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Running test: ${testName}`);
    console.log('='.repeat(50));
    
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Test passed: ${testName} (${duration}ms)`);
      this.testResults.push({ name: testName, status: 'PASSED', duration });
    } catch (error) {
      console.error(`❌ Test failed: ${testName}`);
      console.error('Error:', error.message);
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async createClient(userId) {
    const client = new ChatClient(userId);
    this.clients.set(userId, client);
    await client.waitForRegistration();
    return client;
  }

  async cleanupClients() {
    for (const [userId, client] of this.clients) {
      client.disconnect();
    }
    this.clients.clear();
    await new Promise(resolve => setTimeout(resolve, 500)); // Allow cleanup
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Basic Connection and Registration
  async testBasicConnection() {
    const alice = await this.createClient('Alice');
    
    if (!alice.isRegistered) {
      throw new Error('Client failed to register');
    }
    
    console.log('✓ Client connected and registered successfully');
  }

  // Test 2: Real-time Messaging
  async testRealTimeMessaging() {
    const alice = await this.createClient('Alice');
    const bob = await this.createClient('Bob');
    
    await this.wait(500);
    
    // Clear previous messages
    alice.clearData();
    bob.clearData();
    
    // Alice sends message to Bob
    alice.sendMessage('Bob', 'Hello Bob!');
    
    // Wait for message delivery
    await this.wait(1000);
    
    if (bob.messages.length !== 1) {
      throw new Error(`Expected 1 message, got ${bob.messages.length}`);
    }
    
    const receivedMessage = bob.messages[0];
    if (receivedMessage.from !== 'Alice' || receivedMessage.message !== 'Hello Bob!') {
      throw new Error('Message content mismatch');
    }
    
    console.log('✓ Real-time message delivered successfully');
  }

  // Test 3: Offline Message Buffering
  async testOfflineMessaging() {
    const alice = await this.createClient('Alice');
    const bob = await this.createClient('Bob');
    
    await this.wait(500);
    
    // Bob goes offline
    bob.disconnect();
    await this.wait(1000);
    
    // Alice sends messages to offline Bob
    alice.sendMessage('Bob', 'Message 1 while offline');
    alice.sendMessage('Bob', 'Message 2 while offline');
    alice.sendMessage('Bob', 'Message 3 while offline');
    
    await this.wait(1000);
    
    // Bob comes back online
    bob.clearData();
    bob.reconnect();
    await bob.waitForRegistration();
    
    // Wait for offline messages to be delivered
    await this.wait(2000);
    
    if (bob.messages.length !== 3) {
      throw new Error(`Expected 3 offline messages, got ${bob.messages.length}`);
    }
    
    console.log('✓ Offline messages buffered and delivered successfully');
  }

  // Test 4: User Status Updates
  async testUserStatus() {
    const alice = await this.createClient('Alice');
    alice.clearData();
    
    const bob = await this.createClient('Bob');
    
    // Wait for status update events
    await this.wait(1000);
    
    // Check if Alice received Bob's join event
    const joinEvents = alice.events.filter(e => e.type === 'user_joined');
    if (joinEvents.length === 0) {
      throw new Error('No user join events received');
    }
    
    // Bob disconnects
    alice.clearData();
    bob.disconnect();
    await this.wait(1000);
    
    // Check if Alice received Bob's leave event
    const leaveEvents = alice.events.filter(e => e.type === 'user_left');
    if (leaveEvents.length === 0) {
      throw new Error('No user leave events received');
    }
    
    console.log('✓ User status updates working correctly');
  }

  // Test 5: Typing Indicators
  async testTypingIndicators() {
    const alice = await this.createClient('Alice');
    const bob = await this.createClient('Bob');
    
    await this.wait(500);
    bob.clearData();
    
    // Alice starts typing
    alice.startTyping('Bob');
    await this.wait(500);
    
    // Check if Bob received typing indicator
    const typingEvents = bob.events.filter(e => e.type === 'user_typing');
    if (typingEvents.length === 0) {
      throw new Error('No typing indicator received');
    }
    
    // Alice stops typing
    alice.stopTyping('Bob');
    await this.wait(500);
    
    // Check if Bob received stop typing indicator
    const stopTypingEvents = bob.events.filter(e => e.type === 'user_stopped_typing');
    if (stopTypingEvents.length === 0) {
      throw new Error('No stop typing indicator received');
    }
    
    console.log('✓ Typing indicators working correctly');
  }

  // Test 6: Chat History API
  async testChatHistoryAPI() {
    const alice = await this.createClient('Alice');
    const bob = await this.createClient('Bob');
    
    await this.wait(500);
    
    // Send some messages
    alice.sendMessage('Bob', 'Test message 1');
    await this.wait(200);
    bob.sendMessage('Alice', 'Test message 2');
    await this.wait(200);
    alice.sendMessage('Bob', 'Test message 3');
    
    await this.wait(1000);
    
    // Fetch chat history via API
    const chatHistory = await this.api.get('/messages?user1=Alice&user2=Bob');
    
    if (!chatHistory.messages || chatHistory.messages.length < 3) {
      throw new Error(`Expected at least 3 messages in history, got ${chatHistory.messages?.length || 0}`);
    }
    
    console.log('✓ Chat history API working correctly');
    console.log(`  - Retrieved ${chatHistory.messages.length} messages`);
  }

  // Test 7: User Management API
  async testUserManagementAPI() {
    const alice = await this.createClient('Alice');
    const bob = await this.createClient('Bob');
    
    await this.wait(1000);
    
    // Test health endpoint
    const health = await this.api.get('/health');
    if (health.status !== 'ok') {
      throw new Error('Health check failed');
    }
    
    // Test users endpoint
    const users = await this.api.get('/users');
    if (!users.allUsers || users.allUsers.length < 2) {
      throw new Error('Expected at least 2 users');
    }
    
    // Test specific user endpoint
    const aliceInfo = await this.api.get('/users/Alice');
    if (aliceInfo.userId !== 'Alice' || aliceInfo.status !== 'online') {
      throw new Error('User info incorrect');
    }
    
    console.log('✓ User management API working correctly');
    console.log(`  - Total users: ${users.allUsers.length}`);
    console.log(`  - Online users: ${users.onlineUsers.length}`);
  }

  // Test 8: Multiple Clients Stress Test
  async testMultipleClients() {
    const clients = [];
    const userIds = ['User1', 'User2', 'User3', 'User4', 'User5'];
    
    // Create multiple clients
    for (const userId of userIds) {
      const client = await this.createClient(userId);
      clients.push(client);
    }
    
    await this.wait(1000);
    
    // Each client sends a message to every other client
    for (let i = 0; i < clients.length; i++) {
      for (let j = 0; j < clients.length; j++) {
        if (i !== j) {
          clients[i].sendMessage(userIds[j], `Hello from ${userIds[i]} to ${userIds[j]}`);
        }
      }
    }
    
    await this.wait(3000);
    
    // Verify each client received messages from others
    for (let i = 0; i < clients.length; i++) {
      const expectedMessages = userIds.length - 1; // Messages from all others
      if (clients[i].messages.length < expectedMessages) {
        throw new Error(`${userIds[i]} received ${clients[i].messages.length} messages, expected at least ${expectedMessages}`);
      }
    }
    
    console.log('✓ Multiple clients stress test passed');
    console.log(`  - ${clients.length} clients created`);
    console.log(`  - ${clients.length * (clients.length - 1)} messages sent`);
  }

  // Test 9: Message Acknowledgment
  async testMessageAcknowledgment() {
    const alice = await this.createClient('Alice');
    const bob = await this.createClient('Bob');
    
    await this.wait(500);
    alice.clearData();
    
    alice.sendMessage('Bob', 'Test acknowledgment');
    
    await this.wait(1000);
    
    const ackEvents = alice.events.filter(e => e.type === 'message_ack');
    if (ackEvents.length === 0) {
      throw new Error('No message acknowledgment received');
    }
    
    const ack = ackEvents[0].data;
    if (ack.status !== 'received') {
      throw new Error('Invalid acknowledgment status');
    }
    
    console.log('✓ Message acknowledgment working correctly');
  }

  // Test 10: Error Handling
  async testErrorHandling() {
    // Test invalid API endpoints
    try {
      await this.api.get('/nonexistent');
      throw new Error('Should have thrown 404 error');
    } catch (error) {
      if (!error.message.includes('404')) {
        throw error;
      }
    }
    
    // Test invalid user lookup
    try {
      await this.api.get('/users/NonexistentUser');
      throw new Error('Should have thrown 404 for nonexistent user');
    } catch (error) {
      if (!error.message.includes('404')) {
        throw error;
      }
    }
    
    // Test invalid message history request
    try {
      await this.api.get('/messages?user1=Alice'); // Missing user2
      throw new Error('Should have thrown 400 for incomplete request');
    } catch (error) {
      if (!error.message.includes('400')) {
        throw error;
      }
    }
    
    console.log('✓ Error handling working correctly');
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Chat Application Test Suite');
    console.log('='.repeat(60));
    
    const tests = [
      { name: 'Basic Connection and Registration', fn: () => this.testBasicConnection() },
      { name: 'Real-time Messaging', fn: () => this.testRealTimeMessaging() },
      { name: 'Offline Message Buffering', fn: () => this.testOfflineMessaging() },
      { name: 'User Status Updates', fn: () => this.testUserStatus() },
      { name: 'Typing Indicators', fn: () => this.testTypingIndicators() },
      { name: 'Chat History API', fn: () => this.testChatHistoryAPI() },
      { name: 'User Management API', fn: () => this.testUserManagementAPI() },
      { name: 'Message Acknowledgment', fn: () => this.testMessageAcknowledgment() },
      { name: 'Multiple Clients Stress Test', fn: () => this.testMultipleClients() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() }
    ];
    
    for (const test of tests) {
      await this.runTest(test.name, test.fn);
      await this.cleanupClients();
      await this.wait(1000); // Cool down between tests
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(r => {
      const status = r.status === 'PASSED' ? '✅' : '❌';
      const duration = r.duration ? ` (${r.duration}ms)` : '';
      console.log(`  ${status} ${r.name}${duration}`);
    });
    
    console.log('\n' + '='.repeat(60));
  }
}

// Demo function for quick testing
async function runQuickDemo() {
  console.log('🚀 Running Quick Chat Demo\n');
  
  const alice = new ChatClient('Alice');
  const bob = new ChatClient('Bob');
  
  // Wait for connections
  await alice.waitForRegistration();
  await bob.waitForRegistration();
  
  console.log('\n📝 Sending messages...');
  alice.sendMessage('Bob', 'Hello Bob! How are you?');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  bob.sendMessage('Alice', 'Hi Alice! I\'m doing great!');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📊 Final stats:');
  console.log('Alice:', alice.getStats());
  console.log('Bob:', bob.getStats());
  
  alice.disconnect();
  bob.disconnect();
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--demo')) {
    runQuickDemo().catch(console.error);
  } else if (args.includes('--quick')) {
    // Run only essential tests
    const testSuite = new ChatTestSuite();
    Promise.resolve()
      .then(() => testSuite.runTest('Basic Connection', () => testSuite.testBasicConnection()))
      .then(() => testSuite.runTest('Real-time Messaging', () => testSuite.testRealTimeMessaging()))
      .then(() => testSuite.runTest('Chat History API', () => testSuite.testChatHistoryAPI()))
      .then(() => testSuite.printSummary())
      .catch(console.error);
  } else {
    // Run full test suite
    const testSuite = new ChatTestSuite();
    testSuite.runAllTests().catch(console.error);
  }
}

module.exports = { ChatClient, ChatTestSuite, ApiHelper };