var config = {};

config.port = process.env.PORT || 3000;

//NOTE: SECURE INFO SHOULD NOT BE COMMITTED TO PUBLIC GIT
//mongodb config
config.mongodb = {
  database_url: process.env.MONGODB_URL
};

config.sys_location = process.env.SYS_LOCATION;

config.base_url = process.env.BASE_URL;

module.exports = config;