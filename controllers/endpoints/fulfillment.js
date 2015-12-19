var express = require('express');
var uuid = require('uuid');
var async = require('async');
var math = require('math');


var PythonShell = require('python-shell');
var db = require('../database/database.js');
var logger = require('../../log/logger.js')

var connection = db.connect();
var log = logger.getLogger();


DEFAULT_SUCCUUID = [
	'uuid1',
	'uuid2',
	'uuid3',
	'uuid4',
	'uuid5'
]

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	var callb = req.body.callback;
	var modules_arr = req.body.modules;
	
	for(i=0; i < modules_arr.length; i++) {
		var exp_uuid = modules_arr[i].experimentUuid;
		if (modules_arr[i].activeVariation.toLowerCase() == 'null') {
			// person is not in test yet. decide if in test or feed winning
			args = {
				expUuid : exp_uuid
			};
			var queryString = 'SELECT prop, numVar, succUuid FROM experiments WHERE ?';
			connection.query(queryString, args, function(err, rows, fields) {
				if (err) {
					log.err(err.message, 'Query get experiment ' + exp_uuid);
					throw err;
				}
				
			 test_uuid = uuid.v4();

				// Get random number
				if (math.random()*100 <= parseInt(rows[0].prop,10)) {
					log.info("TEST SUBJECT: RANDOM VAR");
					//test person! select random variation, fetch results and serve

					async.parallel([
						function(callback) {
							getRandomVariation(exp_uuid, callback); // later pass inputs to this
						},
						function(callback) {
							getSuccesFn(rows[0].succUuid, callback);
						}
					], function(err, results) {
						if (err) {
							log.err(err.message, 'Parralel getRandomVariation and getSuccesFn');
							throw err;
						}
						var variation_uuid = results[0].variationUuid;
						res.json({
							'testUuid': test_uuid,
							'html': [
								results[0].html
							],
							'css': results[0].css,
							'js': results[0].js,
							'succ': results[1]
						});
						
						// add to in-test database
						args = {
						 'testUuid' : test_uuid,
						 'variationUuid' : variation_uuid,
						 'expUuid' : exp_uuid
						}
						var queryString = 'INSERT INTO ' + exp_uuid + '_intest SET ?';
						connection.query(queryString, args, function(err, rows, fields) {
							if (err) {
								log.err(err.message, 'Query insert intest');
								throw err;
							}
							log.info({'Rows affected' : rows.affectedRows}, 'Insert ' + test_uuid + 'into intest');
						});	
					});
				} else {
					log.info("NON-TEST SUBJECT: PREDICT WINNING");
					// run in parallel. Two independent tasks
					// predict variation by machine learning
					// fetch corresponding test function
					//console.log("WHAT IS THIS: " + JSON.stringify(rows));
					//console.log("numVar: %s", rows[0].numVar);
					var inputs = [rows[0].numVar];// ...[, '5', '26', 'job']
					predictVariation(inputs, function(err, results) {
						if (err) {
							log.err(err.message, 'Predict variation');
							throw err;
						}						
						var winVarUuid = results[0];
						getVariation(winVarUuid, exp_uuid, function(err, results) {
							if (err) {
								log.err(err.message, 'Get variation');
								throw err;
							}
							res.json({
								'testUuid': test_uuid,
								'html': [
									results.html
								],
								'css': results.css,
								'js': results.js,
								'succ': null
							});
						});
					});					
				}
			})
		} else {
			log.info("ALREADY IN TEST: FEED ACTIVE VARIATION");
			// person is already in test, feed already active variation in response!
			getVariation(modules_arr[i].activeVariation, exp_uuid, function(err, results) {
				if (err) {
					log.err(err.message, 'Get variation');
					throw err;
				}
				res.json({
					'testUuid': null,
					'html': [
						results.html
					],
					'css': results.css,
					'js': results.js,
					'succ': null
				});
			});
		}
	}
};


function getRandomVariation(expUuid, callback) {
	// This is very slow. Optimize later.
	var queryString = 'SELECT variationUuid, CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM ' + expUuid + '_variations ORDER BY RAND() LIMIT 1';
	connection.query(queryString, function(err, rows, fields) {
		if (err) {
			callback(err, err.message);
		}
		callback(null, {
			'variationUuid' : rows[0].variationUuid,
			'html' : rows[0].html,
			'css' : rows[0].css,
			'js' : rows[0].js
		});	
	});		
}



function getVariation(varUuid, expUuid, callback) {
	var varUuid = 'vuuid1'; // in real-life the python script will feedback var uuid
	args = {
		variationUuid : varUuid
	}
	var queryString =  'SELECT CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM ' + expUuid + '_variations' + ' WHERE ?';
	connection.query(queryString, args, function(err, rows, fields) {
		if (err) {
			callback(err, err.message);
		}
		callback(null, {
			'html' : rows[0].html,
			'css' : rows[0].css,
			'js' : rows[0].js
		});	
	});		
}




function predictVariation(inputs, callback) {
	var options = {
			mode: 'text',
			pythonPath: '/usr/bin/python2.7',
			pythonOptions: ['-u'],
			scriptPath: __dirname + '/../ai',
			args: inputs
		};
	PythonShell.run('gradientBoosting.py', options, function (err, results) {
		if (err) {
			callback(err, err.message);
		} else if (results) {
			callback(null, results);
		}
	});
}




function getSuccesFn(succUuid, callback) {
	var tmp_succUuid = null;
	for (var i = 0; i < DEFAULT_SUCCUUID.length; i++ ){
		if (succUuid == DEFAULT_SUCCUUID[i]) {
			tmp_succUuid = succUuid;
			break;
		}
	}
	
	if (!tmp_succUuid) {
		args = {
			succUuid : succUuid			
		}
		var queryString = 'SELECT CAST(fn AS CHAR(10000) CHARACTER SET utf8) AS fn, argstr1, argstr2, argstr3, argstr4 FROM successfns WHERE ?';
		connection.query(queryString, args, function(err, rows, fields) {
			if (err) {
				callback(err, err.message);				
			}
			callback(null, {
					'succUuid': succUuid,
					'succFn': rows[0].fn,
					'arg1': rows[0].argstr1,
					'arg2': rows[0].argstr2,
					'arg3': rows[0].argstr3,
					'arg4': rows[0].argstr4
			});	
		}

	)} else {
		callback(null, {
				'succUuid': succUuid,
				'succFn': 'null',
		});			
	}	
} 


