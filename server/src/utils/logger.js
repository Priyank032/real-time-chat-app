class Logger {
  static log(event, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${event}:`, data);
  }

  static error(event, error, data = {}) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR ${event}:`, { error: error.message, ...data });
  }
}

module.exports = Logger;