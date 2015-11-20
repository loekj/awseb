var express = require('express');
var uuid = require('uuid');
var async = require('async');
var math = require('math');

var PythonShell = require('python-shell');
var db = require('../database/database.js');

DEFAULT_SUCCUUID = {
	'uuid1',
	'uuid2',
	'uuid3',
	'uuid4',
	'uuid5'
}

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	req.query = req.body;
	var callb = req.query.callback;
	var user_uuid = req.query.userUuid;
	var modules_arr = req.query.modules;
	for(i=0; i < modules_arr.length; i++) {
		if (modules_arr[i].activeVariation.toLowerCase() == 'null') {
			var exp_uuid = modules_arr.experimentUuid;
			// person is not in test yet. decide if in test
			// Get random number

			var db_obj = db.connect();
			var queryString = 'SELECT prop, numVar, succUuid FROM experiments WHERE expUuid=?';
			connection.query(queryString, [expUuid], function(err, rows, fields) {
				if (err) {
					console.log(err);
					throw err;
				}
				if (parseInt(fields.prop,10) <= math.random()*100) {
					//test person! select random variation, fetch results and serve
				} else {
					//get winning variation
					var inputs = [fields.numVar];// ...[, '5', '26', 'job']

					// run in parallel. Two independent tasks
					async.parallel([
						function(callback) {
							predictVariation(inputs, callback);
						},
						function(callback) {
							getSuccesFn(fields.succUuid, callback);
						}
					], function(err, results) {
						testUuid = uuid.v4(); // create testUuid
						console.log(results);
						var winVarUuid = results[0];
						getVariation(winVarUuid, function(err, results) {
							if (err) {
								// do blag
							}
							res.json({
								'testUuid': testUuid,
								'html': {
									results.html
								},
								'css': results.css,
								'js': results.js,
								'succ': results[1];
							});						
						});
						// add to intest-database
					});

				}
				
		} else {
			// person is already in test, feed already active variation in response!
		}
	}
};




function getVariation(winVarUuid, expUuid, callback) {
	var queryString = 'SELECT fn, argstr1, argstr2, argstr3, argstr4 FROM ' + expUuid + '.variations' + ' WHERE variationUuid=?';
	connection.query(queryString, [winVarUuid], function(err, rows, fields) {
		if (err) {
			console.log(err);
			callback(err, err.message);
		}
		callback(null, {
				'succUuid': succUuid,
				'succFn': fields.fn,
				'arg1': fields.argstr1,
				'arg2': fields.argstr2,
				'arg3': fields.argstr3,
				'arg4': fields.argstr4
		});	
	}	
}




function predictVariation(inputs, callback) {
	var options = {
			mode: 'text',
			pythonPath: '/usr/bin/python2.7',
			pythonOptions: ['-u'],
			scriptPath: __dirname + '/../ai',
			args: inputs //latter 2 args are e.g. user account data from client's server
		};
	PythonShell.run('gradientBoosting.py', options, function (err, results) {
		if (err) {
			//LOGGER: console.log(JSON.stringify(err.traceback));
			console.log(err);
			console.log(results);
			callback(err, err.message);
		} else if (results) {
			callback(null, results);
		}
	});
}










function getSuccesFn(succUuid, callback) {
	var tmp_succUuid = null;
	for (var i = 0; i < DEFAULT_SUCCUUID.size(); i++ ){
		if (succUuid == DEFAULT_SUCCUUID[i]) {
			tmp_succUuid = succUuid;
			break;
		}
	}
	
	if (!tmp_succUuid) {
		var queryString = 'SELECT fn, argstr1, argstr2, argstr3, argstr4 FROM successfns WHERE succUuid=?';
		connection.query(queryString, [succUuid], function(err, rows, fields) {
			if (err) {
				console.log(err);
				throw err;
			}
			callback(null, {
					'succUuid': succUuid,
					'succFn': fields.fn,
					'arg1': fields.argstr1,
					'arg2': fields.argstr2,
					'arg3': fields.argstr3,
					'arg4': fields.argstr4
			});	
		}

	)} else {
		callback(null, {
				'succUuid': succUuid,
				'succFn': 'null',
		});			
	}	
} 


		