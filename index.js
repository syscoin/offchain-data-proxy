require('dotenv').config();

const express = require('express');
const bodyParser= require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const SyscoinClient = require('syscoin-core');
const syscoinAuth = require('syscoin-auth');
const fs = require('fs');
const RateLimit = require('express-rate-limit');

const config = require('./config');
let db, syscoinClient, rpcuser = "u", rpcpass = "p", rpcport = 8336;

const limiter = new RateLimit(config.rate_limit);

MongoClient.connect(config.mongodb.database_url, (err, database) => {
  if (err) return console.log(err);

  console.log("Database connection success.");
  db = database;
  initSyscoinClient();
});

function initSyscoinClient() {

  let inputStreamError = false;
  let inputStream = fs.createReadStream(config.sys_location + "syscoin.conf");
  inputStream.on('error', function (e) {
    console.log(`Error reading syscoin.conf specified at ${config.sys_location}. Exact error is: ${JSON.stringify(e)}`);
    console.log('Syscoin.conf must be present, with rpcuser, rpcpass, and rpcport set in order to run this server.');
    process.exit();
  });

  if(!inputStreamError) {
    let lineReader = require('readline').createInterface({
      input: inputStream
    });

    //read syscoin.conf for login creds, if it doesn't exist use defaults.
    lineReader.on('line', function (line) {
      if (line.indexOf('rpcuser=') === 0) {
        rpcuser = line.substr(line.indexOf('=') + 1);
      }

      if (line.indexOf('rpcpassword=') === 0) {
        rpcpass = line.substr(line.indexOf('=') + 1);
      }

      if (line.indexOf('rpcport=') === 0) {
        rpcport = line.substr(line.indexOf('=') + 1);
      }
    });

    //init SYS API on close of config file read
    lineReader.on('close', function (line) {
      initAPI();
    });
  }

  function initAPI() {
    console.log("RPCUSER:", rpcuser);
    console.log("RPCPASS:", rpcpass);
    console.log("RPCPORT:", rpcport);

    syscoinClient = new SyscoinClient({
      host: 'localhost',
      port: rpcport,
      username: rpcuser,
      password: rpcpass,
      timeout: 30000
    });

    initApp();
  }
}

function initApp() {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  //CORS
  app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false //critical for proper swagger cors operations
  }));

  app.use('/reportoffer', limiter);

  app.listen(config.port, () => {
    console.log(`listening on port ${config.port}`);
  });

  app.get('/', (req, res) => {
    return res.send('Proxy server operational.');
  });

  app.get('/aliasdata/:aliasname', (req, res) => {
    const collection = db.collection('aliasdata');
    const aliasName = req.params.aliasname.toLowerCase();

    console.log(`Searching for alias ${aliasName}`);
    let findFilter = {};
    try {
      findFilter._id = ObjectId(aliasName);

      //ObjectID testing is a fickle thing- https://stackoverflow.com/questions/13850819/can-i-determine-if-a-string-is-a-mongodb-objectid
      if(findFilter._id.toString() == aliasName) {
        console.log(`Searching for alias by id: ${JSON.stringify(findFilter)}`);
      }else{
        delete findFilter._id;
        throw new Error('Attempted to cast non-ObjectID to ObjectID');
      }
    } catch(e) {
      findFilter.aliasName = aliasName;
      console.log(`Searching for alias by name: ${JSON.stringify(findFilter)}`);
    }

    try {
      collection.findOne(findFilter, (err, item) => {
        if (err) {
          return res.send(`Error with request: ${err}`);
        }

        if (item) {
          console.log(`Found result for ${aliasName}`);
          delete item._id;
          delete item.dataType;
          return res.send(JSON.stringify(item));
        } else {
          console.log(`No record found for ${aliasName}`);
          return res.send(`No matching records for ${aliasName}`);
        }
      });
    } catch(e) { //catch errors related to invalid id formatting
      return res.send(`Error with request: ${e}`);
    }
  });

  app.post('/aliasdata/:aliasname', (req, res) => {
    const collection = db.collection('aliasdata');
    const aliasName = req.params.aliasname.toLowerCase();

    const aliasData = JSON.parse(req.body.payload);

    const hashVerified = syscoinAuth.verifyHash(req.body.payload, req.body.hash);
    if(!hashVerified) {
      console.log(`Hashes do not match for ${aliasName}`);
      return res.send(`Hashes do not match for ${aliasName}`);
    }

    syscoinClient.aliasInfo(aliasName).then((result) => {
      if(!result && !result.address) {
        console.log(`Invalid alias ${aliasName}`);
        return res.send(`Invalid alias ${aliasName}`);
      }
      const sigVerified = syscoinAuth.verifySignature(
        req.body.hash,
        req.body.signedHash,
        result.address
      );
      if(!sigVerified) {
        console.log(`Signature verification failed for ${aliasName}`);
        return res.send(`Signature verification failed for ${aliasName}`);
      }
      try {
        aliasData.dataType = 'aliasdata';
        collection.updateOne({
          aliasName: aliasName,
          dataType: 'aliasdata'
        }, aliasData, { upsert: true }, (err) => {
          if (err) {
            return res.send(`Error with request: ${err}`);
          }
          return res.send(JSON.stringify(
            {
              storeLocations: [{
                dataUrl: `${config.base_url}/aliasdata/${aliasName}`
              }]
            }
          ));
        });
      } catch(e) { //catch errors related to invalid id formatting
        return res.send(`Error with request: ${e}`);
      }
    });

  });

  app.post('/reportoffer', (req, res) => {
    const collection = db.collection('offerreports');
    const reportData = JSON.parse(req.body.payload);

    const hashVerified = syscoinAuth.verifyHash(req.body.payload, req.body.hash);
    if(!hashVerified) {
      console.log(`Hashes do not match for ${req.body.address}`);
      return res.send(`Hashes do not match for ${req.body.address}`);
    }

    const sigVerified = syscoinAuth.verifySignature(
      req.body.hash,
      req.body.signedHash,
      req.body.address
    );
    if(!sigVerified) {
      console.log(`Signature verification failed for ${req.body.address}`);
      return res.send(`Signature verification failed for ${req.body.address}`);
    }

    try {
      collection.insertOne(reportData, (err) => {
        if(err) {
          return res.send(`Error inserting report data: ${err}`);
        }
        res.send(JSON.stringify({
          success: true
        }))
      });
    } catch (e) {
      return res.send(`Error inserting report data: ${e}`);
    }
  });

}

