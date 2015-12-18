var express = require('express');
var uuid = require('uuid');
var async = require('async');
var math = require('math');


var PythonShell = require('python-shell');
var db = require('../database/database.js');
var logger = require('../../log/logger.js')

var connection = db.connect();
var log = logger.getLogger();

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	var exp_uuid = req.body.expUuid;
	var user_uuid = req.body.userUuid;
	var test_uuid = req.body.testUuid;
	var modules_arr = req.body.modules;
	var time_of_day = req.body.timeOfDay;
	var timestamp = req.body.timestamp;
	var result = req.body.result;

	// fetch person from intest and delete from intest
	args = [
		result,
		test_uuid
	]
	var query_string = 'INSERT INTO ' + exp_uuid + '_userdata (testUuid, variationUuid, expUuid, miscFields, successReturn) SELECT testUuid, variationUuid, expUuid, miscFields, ? FROM ' + exp_uuid + '_intest WHERE testUuid=?';
	connection.query(query_string, args, function(err, rows, fields) {
		if (err) {
			log.err(err.message, 'Query move to ' + exp_uuid + '_userdata');
			throw err;
		}
		if (fields.rowsAffected != '1') {
			log.err('No rows affect query move to ' + exp_uuid + '_userdata');
			throw err;
		}

		// only delete from intest if previous was successful
		args = {
			'testUuid' : test_uuid
		}
		var query_string = 'DELETE FROM ' + exp_uuid + '_intest WHERE ?';		
		connection.query(query_string, args, function(err, rows, fields) {
			if (err) {
				log.err(err.message, 'Query delete ' + exp_uuid + '_intest');
				throw err;
			}

			// must exist, so if not deleted, throw error
			if (fields.rowsAffected != '1') {
				log.err('No rows affect query delete' + exp_uuid + '_intest WHERE testUuid=' + test_uuid);
				throw err;
			}
		});
	});
}


