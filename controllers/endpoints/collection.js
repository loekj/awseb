var express = require('express')
var uuid = require('uuid')
var async = require('async')
var math = require('math')


var PythonShell = require('python-shell')
var db = require('../database/database.js')
var logger = require('../../log/logger.js')

var connection = db.connect()
var log = logger.getLogger()


sendResponse = function(res, code) {
	res.status(code).json({})
}

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	var callb = req.body.callback
	var exp_uuid = req.body.expUuid
	var test_uuid = req.body.testUuid
	var time_of_day = req.body.timeOfDay
	var outcome = req.body.result

	var module_id = new db.mongo.ObjectId(req.body.expUuid)
	db.mongo.data.update(
	{
		'data.testUuid' : test_uuid
	},
	{
		$set : {
			'data.result' = outcome
		}
	},
	function(err, result) {
		if (err) {
			sendResponse(res, 400)
		}
		sendResponse(res, 200)
	})
}


