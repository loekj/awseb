var express = require('express');
var uuid = require('uuid');
var async = require('async');
var math = require('math');

var PythonShell = require('python-shell');
var db = require('../database/database.js');

DEFAULT_SUCCUUID = [
	'uuid1',
	'uuid2',
	'uuid3',
	'uuid4',
	'uuid5'
]

var mysql = require('mysql');
var connection = mysql.createConnection({
	host     : process.env.RDS_HOSTNAME,
	user     : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port     : process.env.RDS_PORT,
	database : process.env.RDS_DB_NAME
});

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	req.query = req.body;
	var callb = req.query.callback;
	var user_uuid = req.query.userUuid;
	var modules_arr = req.query.modules;
	//console.log("req.QUERY RESULTS: " + JSON.stringify(req.query));
	/* For when multiple modules at once
	response = [];
	requests_todo = modules_arr.length;
	*/
	for(i=0; i < modules_arr.length; i++) {
		// for now only handles 1 element in modules_arr. need to concat version later
		// This version is async, does not work maybe due to DB connection. Change to series()...
		// getResponse(modules_arr[i], user_uuid, function(err, results) {
		// 	if (err) {
		// 		console.log(err);
		// 		throw err;
		// 	}			
		// 	response.push(results);

		// 	// finish all callbacks, prepare response
		// 	if (--requests_todo === 0) {

		// 	}
		// });

		if (modules_arr[i].activeVariation.toLowerCase() == 'null') {
			var exp_uuid = modules_arr[i].experimentUuid;
			// person is not in test yet. decide if in test
			// Get random number

			var db_obj = db.connect();
			var queryString = 'SELECT prop, numVar, succUuid FROM experiments WHERE expUuid=?';
			connection.query(queryString, [exp_uuid], function(err, rows, fields) {
				if (err) {
					console.log(err);
					throw err;
				}
				//console.log("QUERY RESULTS: " + JSON.stringify(rows));
				testUuid = uuid.v4(); // create testUuid
				if (math.random()*100 <= parseInt(rows[0].prop,10)) {
					console.log("GET RANDOM!!!");
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
							console.log(err);
							throw err;
						}
						res.json({
							'testUuid': testUuid,
							'html': [
								results[0].html
							],
							'css': results[0].css,
							'js': results[0].js,
							'succ': results[1]
						});
						
						// add to inTest-database later

					});
				} else {
					console.log("PREDICT WINNING!!!");
					// run in parallel. Two independent tasks
					// predict variation by machine learning
					// fetch corresponding test function
					//console.log("WHAT IS THIS: " + JSON.stringify(rows));
					//console.log("numVar: %s", rows[0].numVar);
					var inputs = [rows[0].numVar];// ...[, '5', '26', 'job']
					predictVariation(inputs, function(err, results) {
						if (err) {
							console.log("ERROR IN PREDICTVARRRRR");
							console.log(err);
							throw err;
						}						
						var winVarUuid = results[0];
						getVariation(winVarUuid, exp_uuid, function(err, results) {
							if (err) {
								console.log(err);
								throw err;
							}
							res.json({
								'testUuid': testUuid,
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
			// person is already in test, feed already active variation in response!
		}
	}
};


function getRandomVariation(expUuid, callback) {
	// This is very slow. Optimize later.
	var queryString = 'SELECT CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM ' + expUuid + '_variations' + ' ORDER BY RAND() LIMIT 1';
	connection.query(queryString, function(err, rows, fields) {
		if (err) {
			console.log(err);
			callback(err, err.message);
		}
		callback(null, {
			'html' : rows[0].html,
			'css' : rows[0].css,
			'js' : rows[0].js
		});	
	});		
}



function getVariation(winVarUuid, expUuid, callback) {
	var winVarUuid = 'vuuid1'; // in real-life the python script will feedback var uuid
	var queryString =  'SELECT CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM ' + expUuid + '_variations' + ' WHERE variationUuid=?';
	connection.query(queryString, [winVarUuid], function(err, rows, fields) {
		if (err) {
			console.log(err);
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
			LOGGER: console.log("ERROR FROM AI: %s", JSON.stringify(err.traceback));
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
	for (var i = 0; i < DEFAULT_SUCCUUID.length; i++ ){
		if (succUuid == DEFAULT_SUCCUUID[i]) {
			tmp_succUuid = succUuid;
			break;
		}
	}
	
	if (!tmp_succUuid) {
		var queryString = 'SELECT CAST(fn AS CHAR(10000) CHARACTER SET utf8) AS fn, argstr1, argstr2, argstr3, argstr4 FROM successfns WHERE succUuid=?';
		connection.query(queryString, [succUuid], function(err, rows, fields) {
			if (err) {
				console.log(err);
				throw err;
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


