#!/usr/bin/env node
'use strict';

const cluster = require('cluster');
const os = require('os');
const http = require('http');
const config = require('../config');

if (cluster.isMaster) {
  // create one process per CPU core
  const workers = os.cpus().length;
  for (let i = 0; i < workers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, signal) => {
    console.log(`Server #${worker.id} / pid ${worker.process.pid} died with signal ${signal}.`);
    // load a new app instance
    cluster.fork();
  });
} else if (cluster.isWorker) {
  // load the app instance
  const app = require('../index');  
  
  const server = http.createServer(app);
  server.listen(config.port);
  console.log(`Server #${cluster.worker.id} / pid ${cluster.worker.process.pid} available on port ${config.port}`);
}
