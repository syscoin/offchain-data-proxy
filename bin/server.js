#!/usr/bin/env node
'use strict';

const http = require('http');
const config = require('../config');

// load the app instance
const app = require('../index');

app.set('port', config.port);
app.listen(config.port);

console.log(`Server now available on port ${config.port}`);
