const validateChatRequest = (req, res, next) => {
  const { user1, user2 } = req.query;
  
  if (!user1 || !user2) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['user1', 'user2']
    });
  }
  
  if (user1 === user2) {
    return res.status(400).json({
      error: 'user1 and user2 cannot be the same'
    });
  }
  
  next();
};

const validateUserId = (req, res, next) => {
  const { userId } = req.params;
  
  if (!userId || userId.trim() === '') {
    return res.status(400).json({
      error: 'Invalid userId'
    });
  }
  
  next();
};

module.exports = {
  validateChatRequest,
  validateUserId
};