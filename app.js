var express = require('express');
var path = require('path');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('./log/logger.js');
var db = require('./controllers/database/database.js');
// var cookieParser = require('cookie-parser');

var log = logger.getLogger();

var mode = process.env.NODE_ENV;
var host = process.env.NODE_HOST;
log.info({NODE_ENV:mode, NODE_HOST:host}, 'env settings');


var app = express();
if (host == 'local') {
	var server = http.createServer(app);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Danger: This is a temporary measure to allow cross-origin JS requests from any domain.  
// We'll need to specify explicit permissions, later on.
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Must match JSONP name var in front-end code:
// app.set('jsonp callback name','sigCallback');

//app.use(cookieParser());
/*
* API Endpoints
*/
if (mode == 'production') {
	var fulfillment = require('./controllers/endpoints/fulfillment.js');
	var register = require('./controllers/endpoints/register.js');
	var collection = require('./controllers/endpoints/collection.js');
	
	app.post('/collection', collection.POST);
	app.post('/fulfillment', fulfillment.POST);
	app.post('/register', register.POST);

} else if (mode == 'debug') {
	var register = require('./controllers/endpoints/register.js');
	var fulfillment = require('./controllers/endpoints/fulfillment.js');
	var collection = require('./controllers/endpoints/collection.js');
	var register = require('./controllers/endpoints/register.js');
	var experiment = require('./controllers/endpoints/exp.js');
	var experiment_id = require('./controllers/endpoints/exp_id.js');
	var experiment_id_variation = require('./controllers/endpoints/exp_id_var.js');
	var experiment_id_variation_id = require('./controllers/endpoints/exp_id_var_id.js');

	app.post('/register', register.POST);

	app.post('/collection', collection.POST);
	app.post('/fulfillment', fulfillment.POST);
	app.post('/register', register.POST);

	app.get('/:userId/exp', experiment.GET);

	app.post('/:userId/exp/:expId', experiment_id.POST);
	app.patch('/:userId/exp/:expId', experiment_id.PATCH);
	app.get('/:userId/exp/:expId', experiment_id.GET);	
	app.delete('/:userId/exp/:expId', experiment_id.DELETE);	

	
	app.get('/:userId/exp/:expId/var', experiment_id_variation.GET);

	app.delete('/:userId/exp/:expId/var/:varId', experiment_id_variation_id.DELETE);
	app.get('/:userId/exp/:expId/var/:varId', experiment_id_variation_id.GET);
	app.post('/:userId/exp/:expId/var/:varId', experiment_id_variation_id.POST);
	app.patch('/:userId/exp/:expId/var/:varId', experiment_id_variation_id.PATCH);
}

if (process.env.NODE_HOST == 'local') {
	db.connect(function(err) {
		if (err) {
			throw err;
		}	
		server.listen(3000, '127.0.0.1');
		server.on('listening', function() {
			console.log('Express server started on port %s at %s', server.address().port, server.address().address);
		});
	});
}

module.exports = app;
