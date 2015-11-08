var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
	next();
});

server.listen(3000, 'localhost');
server.on('listening', function() {
    console.log('Express server started on port %s at %s', server.address().port, server.address().address);
});


//curl -v -H "Accept: application/json" -H "Content-type: application/json" -X GET -d ' {"data":{"userUuid":"attl3nZ3k41fH6wtrA3J3SQJo","tests":{"experimentUuid": "test123", "activeVariation": "null"}}}'  http://127.0.0.1:3000/fulfillment