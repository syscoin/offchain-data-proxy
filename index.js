const express = require('express');
const bodyParser= require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');

const config = require('./config');
let db;

MongoClient.connect(config.mongodb.database_url, (err, database) => {
  if (err) return console.log(err);

  console.log("Database connection success.");
  db = database;
  initApp();
});

function initApp() {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  //CORS
  app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false //critical for proper swagger cors operations
  }));

  app.listen(config.port, () => {
    console.log('listening on 3000');
  });

  app.get('/', (req, res) => {
    res.send('Fetch server operational.');
  });

  app.get('/aliasdata/:id', (req, res) => {
    let collection = db.collection('aliasdata');
    let id = req.params.id;

    console.log(`Searching for id ${id}`);

    try {
      collection.findOne({_id: ObjectId(id)}, (err, item) => {
        if (err) res.send(`Error with request: ${err}`);

        if (item) {
          console.log(`Found result for ${id}`);
          res.send(JSON.stringify(item));
        } else {
          console.log(`No record found for ${id}`);
          res.send(`No matching records for ${id}`);
        }
      });
    }catch(e) { //catch errors related to invalid id formatting
      res.send(`Error with request: ${e}`);
    }
  });
}

