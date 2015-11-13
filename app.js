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
* API Modules
*/
var register = require('./controllers/endpoints/test.js');
var fulfillment = require('./controllers/endpoints/fulfillment.js');
var register = require('./controllers/endpoints/register.js');
//var experiment = require('./controllers/endpoints/experiment.js');

/*
* API Endpoints
*/
app.get('/', test.POST);
app.post('/fulfillment', fulfillment.POST);
app.post('/register', register.POST);
//app.post('/experiment', experiment.POST);


module.exports = app;
