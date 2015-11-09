var express = require('express');

/* 
* POST
*/
exports.POST = function(req, res, next) {
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
	res.json({"name":"assss22ss"});
	//console.log(next);
};