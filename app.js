var express = require('express');
var path = require('path');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('./log/logger.js')
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
//app.use(cookieParser());

/*
* API Endpoints
*/
if (mode == 'production') {
	var fulfillment = require('./controllers/endpoints/fulfillment.js');
	var register = require('./controllers/endpoints/register.js');
	var collection = require('./controllers/endpoints/collection.js');
	// experiment is for registering/editing experiment
	//var experiment = require('./controllers/endpoints/experiment.js');	
	
	app.post('/collection', collection.POST);
	app.post('/fulfillment', fulfillment.POST);
	app.post('/register', register.POST);

} else if (mode == 'debug') {
	var fulfillment = require('./controllers/endpoints/fulfillment.js');
	var collection = require('./controllers/endpoints/collection.js');
	var register = require('./controllers/endpoints/register.js');
	var experiment = require('./controllers/endpoints/experiment.js');
	var variation = require('./controllers/endpoints/variation.js');
	var variation_id = require('./controllers/endpoints/variation_id.js');

	app.post('/collection', collection.POST);
	app.post('/fulfillment', fulfillment.POST);
	app.post('/register', register.POST);

	app.post('/experiment', experiment.POST);
	app.get('/experiment', experiment.GET);

	
	app.delete('/variation', variation.DELETE);
	app.get('/variation', variation.GET);
	app.post('/variation', variation.POST);

	app.get('/variation/:id', variation_id.GET);
	app.post('/variation/:id', variation_id.POST);
}

if (host == 'local') {
	server.listen(3000, '127.0.0.1');
	server.on('listening', function() {
		console.log('Express server started on port %s at %s', server.address().port, server.address().address);
	});
}

module.exports = app;
