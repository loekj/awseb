var express = require('express');
var uuid = require('uuid');
var async = require('async');
var math = require('math');


var PythonShell = require('python-shell');
var db = require('../database/database.js');
var logger = require('../../log/logger.js')

var connection = db.connect(false);
var log = logger.getLogger();


sendResponse = function(res, code) {
	res.writeHead(code);
	res.json();
}

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	var callb = req.body.callback;
	var exp_uuid = req.body.expUuid;
	var test_uuid = req.body.testUuid;
	var time_of_day = req.body.timeOfDay;
	var result = req.body.result;

	// fetch person from intest and delete from intest
	args = [
		result,
		test_uuid
	]
	console.log("VALUES: %s", JSON.stringify(req.body));
	var query_string = 'INSERT INTO ' + exp_uuid + '_userdata (testUuid, variationUuid, expUuid, miscFields, successReturn) SELECT testUuid, variationUuid, expUuid, miscFields, ? FROM ' + exp_uuid + '_intest WHERE testUuid=?';
	connection.query(query_string, args, function(err, rows, fields) {
		if (err) {
			log.error(err.message, 'Query move to ' + exp_uuid + '_userdata');
			sendResponse(res, 400);
		}

		console.log("FIELDS: %s", JSON.stringify(fields));
		console.log("ROWS: %s", JSON.stringify(rows));		
		console.log("ROWS AFFECTED: %s", rows.affectedRows);
		if (rows.affectedRows != '1') {
			log.error('No rows affect query move to ' + exp_uuid + '_userdata');
			sendResponse(res, 400);
		}

		// only delete from intest if previous was successful
		args = {
			'testUuid' : test_uuid
		}
		var query_string = 'DELETE FROM ' + exp_uuid + '_intest WHERE ?';		
		connection.query(query_string, args, function(err, rows, fields) {
			if (err) {
				log.error(err.message, 'Query delete ' + exp_uuid + '_intest');
				sendResponse(res, 400);
			}
			console.log("ROWS AFFECTED: %s", rows.affectedRows);
			console.log("FIELDS: %s", JSON.stringify(fields));
			console.log("ROWS: %s", JSON.stringify(rows));
			// must exist, so if not deleted, throw error

			if (rows.affectedRows != '1') {
				log.error('No rows affect query delete' + exp_uuid + '_intest WHERE testUuid=' + test_uuid);
				sendResponse(res, 400);
			}
			sendResponse(res, 200);
		});
	});
}


