var express = require('express');
var path = require('path');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  port     : process.env.RDS_PORT,
  database : process.env.RDS_DB_NAME
});

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/* 
* API dir
*/
app.get('/fulfillment', function(req, res, next) {
  var ful_query = req.body;
  var tests_arr = ful_query.data.tests;
  for(i=0; i < tests_arr.length; i++) {
    if (tests_arr[i].activeVariation.toLowerCase() == 'null') {
      // person is not in test yet. Activate new test
      break;
    } else {
      // person is already in test, feed already active variation in response!
      break;
    }
  }
  res.json(process.env);
});


/*
* Register account
*/
app.post('/register', function(req, res, next) {
  console.log('user data');
}

/*
* Register experiment
* Upon new experiment, create new tables
*/
app.post('/newexp', function(req, res, next) {
  // function setupVariations(connection, callback){
  //   var ful_query = req.body;
  //   var tests_arr = ful_query.data.tests;
  //   var query = "CREATE TABLE IF NOT EXISTS " + oauth_id + "." + experiment_uuid + ".variations (" +
  //     "id INT NOT NULL AUTO_INCREMENT," +
  //     "addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
  //     "modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
  //     "variationUuid VARCHAR(255) NOT NULL," +
  //     "name VARCHAR(50) NOT NULL DEFAULT 'Untitled'," +
  //     "experimentUuid VARCHAR(255) NOT NULL," +
  //     "js MEDIUMBLOB NOT NULL," +
  //     "css MEDIUMBLOB NOT NULL," +
  //     "html MEDIUMBLOB NOT NULL" +
  //     "PRIMARY KEY ( id )," +
  //     "UNIQUE KEY unique_variationUuid ( variationUuid )" +
  //     ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
  //   runQuery(query, connection, callback);
  // }

  // function setupUserData(connection, callback){
  //   var query = "CREATE TABLE IF NOT EXISTS " + oauth_id + "." + experiment_uuid + ".userdata (" +
  //   "id INT NOT NULL AUTO_INCREMENT," +
  //   "addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
  //   "userUuid VARCHAR(255) NOT NULL," +
  //   "variationUuid VARCHAR(255) NOT NULL," +
  //   "experimentUuid VARCHAR(255) NOT NULL," +
  //   "succesReturn VARCHAR(255) DEFAULT NULL," +
  //   "miscFields MEDIUMBLOB DEFAULT NULL" +
  //   "PRIMARY KEY ( id )" +
  //   ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
  //   runQuery(query, connection, callback);
  // }
}

/* preparing mysql injections
var sql = "SELECT * FROM ?? WHERE ?? = ?";
var inserts = ['users', 'id', userId];
sql = mysql.format(sql, inserts);
*/

module.exports = app;
