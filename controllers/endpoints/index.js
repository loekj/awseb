var express = require('express');

var persistentTest = {x: 1};
/* 
* POST
*/
exports.GET = function(req, res, next) {
  //check auth from cookie by running method on each request
	res.json({
		xValueFromPreviousQString:persistentTest.x
	});
	persistentTest.x = req.query.x || 5;
};