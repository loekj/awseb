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
//app.use(cookieParser());

/* 
 * OAuth
 */
var oauth2lib = require('oauth20-provider');
var oauth2 = new oauth2lib({log: {level: 2}});
app.use(oauth2.inject());

app.post('/token', oauth2.controller.token);
app.get('/authorization', isAuthorized, oauth2.controller.authorization, function(req, res) {
    // Render our decision page
    // Look into ./test/server for further information
    res.render('authorization', {layout: false});
});
app.post('/authorization', isAuthorized, oauth2.controller.authorization);

function isAuthorized(req, res, next) {
    if (req.session.authorized) next();
    else {
        var params = req.query;
        params.backUrl = req.path;
        res.redirect('/login?' + query.stringify(params));
    }
};



/*
* API Endpoints
*/
if (mode == 'production') {
	var fulfillment = require('./controllers/endpoints/fulfillment.js');
	var register = require('./controllers/endpoints/register.js');
	var collection = require('./controllers/endpoints/collection.js');
	var login = require('./controllers/endpoints/login.js');
	
	app.post('/collection', collection.POST);
	app.post('/fulfillment', fulfillment.POST);
	app.post('/register', register.POST);
	
	app.post('/login', login.POST);

} else if (mode == 'debug') {
	var login = require('./controllers/endpoints/login.js');
	var register = require('./controllers/endpoints/register.js');
	var fulfillment = require('./controllers/endpoints/fulfillment.js');
	var collection = require('./controllers/endpoints/collection.js');
	var register = require('./controllers/endpoints/register.js');
	var experiment = require('./controllers/endpoints/exp.js');
	var experiment_id = require('./controllers/endpoints/exp_id.js');
	var experiment_id_variation = require('./controllers/endpoints/exp_id_var.js');
	var experiment_id_variation_id = require('./controllers/endpoints/exp_id_var_id.js');

	app.post('/login', login.POST);
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

db.connect(function(err) {
	if (err) {
		throw err;
	}
	if (process.env.NODE_HOST == 'local') {
		server.listen(3000, '127.0.0.1');
		server.on('listening', function() {
			console.log('Express server started on port %s at %s', server.address().port, server.address().address);
		});
	}
});

module.exports = app;
