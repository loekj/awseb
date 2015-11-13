var express = require('express');

/* 
* POST
*/
var persistentTest = {x: 1};

exports.POST = function(req, res, next) {
	//check auth from cookie by running method on each request
	res.json({
		xValueFromPreviousQString:persistentTest.x
	});
	persistentTest.x = req.query.x || 5;
};

