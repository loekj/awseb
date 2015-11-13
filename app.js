var express = require('express');
var path = require('path');
var http = require('http');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mode = process.env.NODE_ENV;
var host = process.env.NODE_HOST;

if (host == 'remote') {
	var mysql = require('mysql');
	var connection = mysql.createConnection({
	  host     : process.env.RDS_HOSTNAME,
	  user     : process.env.RDS_USERNAME,
	  password : process.env.RDS_PASSWORD,
	  port     : process.env.RDS_PORT,
	  database : process.env.RDS_DB_NAME
	});
}

var app = express();
if (host == 'local') {
	var server = http.createServer(app);
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/*
* API Modules
*/
var test = require('./controllers/endpoints/test.js');
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

if (host == 'local') {
	server.listen(3000, 'localhost');
	server.on('listening', function() {
		console.log('Express server started on port %s at %s', server.address().port, server.address().address);
	});
}

module.exports = app;
