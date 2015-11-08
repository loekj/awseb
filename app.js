var express = require('express');
var path = require('path');
var logger = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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
    console.log(i);
    if (tests_arr[i].activeVariation.toLowerCase() == 'null') {
      // person is not in test yet. Activate new test
      break;
    } else {
      // person is already in test, feed already active variation in response!
      break;
    }
  }
  res.json({"name":"assss"});
});

module.exports = app;
