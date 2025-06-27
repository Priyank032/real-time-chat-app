const generateChatId = (user1, user2) => {
  return [user1, user2].sort().join('-');
};

const generateMessageId = () => {
  return Date.now() + Math.random().toString(36);
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

module.exports = {
  generateChatId,
  generateMessageId,
  getCurrentTimestamp
};