const config = {};

config.port = process.env.PORT || 3000;

// NOTE: SECURE INFO SHOULD NOT BE COMMITTED TO PUBLIC GIT
// mongodb config
config.mongodb = {
  database_url: process.env.MONGODB_URL || 'mongodb://localhost',
};

config.base_url = process.env.BASE_URL || 'https://offchain.syscoin.org';

config.rate_limit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0, // disable delaying - full speed until the max limit is reached
};

config.syscoin = {
  host: process.env.SYSCOIND_HOST || 'localhost',
  port: process.env.SYSCOIND_PORT || 8369,
  username: process.env.SYSCOIND_USER || 'u',
  password: process.env.SYSCOIND_PASS || 'p',
};

module.exports = config;
