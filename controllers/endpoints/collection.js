var express = require('express')

var db = require('../database/database.js')
var logger = require('../../log/logger.js')
var log = logger.getLogger();


sendResponse = function(res, code, data) {
	res.status(code).json(data)
}

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	console.log("COLLECTION.JS")
	console.log(req.body)
	var test_uuid = new db.mongo.ObjectID(req.body.testUuid)
	var outcome = req.body.result
	//var time_of_day = req.body.timeOfDay
	db.mongo.data.update(
	{
		'data.testUuid' : test_uuid
	},
	{
		$set : {
			'data.$.result' : outcome // Should upsert automatically if result not defined
		}
	},
	function(err, result) {
		if (err) {
			console.log(err)
			sendResponse(res, 400, test_uuid)
		} else {
			sendResponse(res, 200, test_uuid)
		}
	})
}


