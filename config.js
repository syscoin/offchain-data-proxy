var config = {};

config.port = process.env.PORT || 3000;

//NOTE: SECURE INFO SHOULD NOT BE COMMITTED TO PUBLIC GIT
//mongodb config
config.mongodb = {
  database_url: process.env.MONGODB_URL
};

config.sys_location = process.env.SYS_LOCATION;

config.base_url = process.env.BASE_URL;

config.rate_limit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
};

module.exports = config;
