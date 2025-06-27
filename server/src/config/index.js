const config = {
  port: process.env.PORT || 3001,
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  env: process.env.NODE_ENV || 'development'
};

module.exports = config;
