const Logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  Logger.error('REQUEST_ERROR', err, {
    url: req.url,
    method: req.method,
    body: req.body
  });

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
};

module.exports = { errorHandler, notFound };