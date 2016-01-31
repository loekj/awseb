var express = require('express')

var db = require('../database/database.js')
var logger = require('../../log/logger.js')
var log = logger.getLogger();


sendResponse = function(res, code) {
	res.status(code).json({})
}

/* 
* API dir
*/
exports.GET = function(req, res, next) {
	var callb = req.body.callback
	var exp_uuid = req.body.expUuid
	var test_uuid = new db.mongo.ObjectID(req.body.testUuid)
	var outcome = parseFloat(req.body.result)
	//var time_of_day = req.body.timeOfDay

	db.mongo.data.update(
	{
		'data.testUuid' : test_uuid
	},
	{
		$set : {
			'data.$.result' : outcome // Upserts automatically if result not defined
		}
	},
	function(err, result) {
		if (err) {
			console.log(err)
			sendResponse(res, 400)
		} else {
			sendResponse(res, 200)
		}
	})
}


