var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


var version = "v1";
var fulfillment = require('./routes/' + version + '/' + 'fulfillment.js');

/* 
* API dir
*/
app.get(fulfillment, function(req, res, next) {
	var ful_query = req.json();
	console.log(ful_query);
	// ful_query.tests.activeVariation;
	// res.json("asd");
});

server.listen(3000, 'localhost');
server.on('listening', function() {
    console.log('Express server started on port %s at %s', server.address().port, server.address().address);
});
