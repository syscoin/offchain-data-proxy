var config = {};

config.port = process.env.PORT || 3000;

//NOTE: SECURE INFO SHOULD NOT BE COMMITTED TO PUBLIC GIT
//mongodb config
config.mongodb = {
  database_url: process.env.MONGODB_URL || ``
};

module.exports = config;