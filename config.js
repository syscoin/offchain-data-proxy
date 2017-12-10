var config = {};

config.port = process.env.PORT || 3000;

//NOTE: SECURE INFO SHOULD NOT BE COMMITTED TO PUBLIC GIT
//mongodb config
config.mongodb = {
  database_url: process.env.MONGODB_URL || `mongodb://localhost`
};

config.sys_location = process.env.SYS_LOCATION || '/home/sebastian/.syscoin/';

module.exports = config;