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

				testUuid = uuid.v4(); // create testUuid

				if (parseInt(fields.prop,10) <= math.random()*100) {
					//test person! select random variation, fetch results and serve

					async.parallel([
						function(callback) {
							getRandomVariation(callback); // later pass inputs to this
						},
						function(callback) {
							getSuccesFn(fields.succUuid, callback);
						}
					], function(err, results) {
						console.log("Results parralel: " + JSON.stringify(results));
						if (err) {
							console.log(err);
							throw err;
						}
						res.json({
							'testUuid': testUuid,
							'html': {
								results[0].html
							},
							'css': results[0].css,
							'js': results[0].js,
							'succ': results[1]
						});
						
						// add to inTest-database later

						});
					});

				} else {
					// run in parallel. Two independent tasks
					// predict variation by machine learning
					// fetch corresponding test function
					var inputs = [fields.numVar];// ...[, '5', '26', 'job']
					predictVariation(inputs, function(err, results) {
						if (err) {
							console.log(err);
							throw err;
						}						
						console.log(results);
						var winVarUuid = results;
						getVariation(winVarUuid, function(err, results) {
							if (err) {
								console.log(err);
								throw err;
							}
							res.json({
								'testUuid': testUuid,
								'html': {
									results.html
								},
								'css': results.css,
								'js': results.js,
								'succ': null
							});
						});
					});					

				}
				
		} else {
			// person is already in test, feed already active variation in response!
		}
	}
};


function getRandomVariation(expUuid, callback) {
	// This is very slow. Optimize later.
	var queryString = 'SELECT html, js, css FROM' + expUuid + '_variations' + ' ORDER BY RAND() LIMIT 1';
	connection.query(queryString, function(err, rows, fields) {
		if (err) {
			console.log(err);
			callback(err, err.message);
		}
		callback(null, {
			'html' : fields.html,
			'css' : fields.css,
			'js' : fields.js
		});	
	});		
}



function getVariation(winVarUuid, expUuid, callback) {
	var queryString =  'SELECT html, js, css FROM' + expUuid + '_variations' + ' WHERE variationUuid=?';
	connection.query(queryString, [winVarUuid], function(err, rows, fields) {
		if (err) {
			console.log(err);
			callback(err, err.message);
		}
		callback(null, {
			'html' : fields.html,
			'css' : fields.css,
			'js' : fields.js
		});	
	});		
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




// async.parallel([
// 						function(callback) {
// 							predictVariation(inputs, callback);
// 						},
// 						function(callback) {
// 							// PROBABLY DONT NEED THIS HERE. MOVE TO SOMEWHERE ELSE!
// 							getSuccesFn(fields.succUuid, callback);
// 						}
// 					], function(err, results) {
// 						console.log(results);
// 						var winVarUuid = results[0];
// 						getVariation(winVarUuid, function(err, results) {
// 							if (err) {
// 								console.log(err);
// 								throw err;
// 							}
// 							res.json({
// 								'testUuid': testUuid,
// 								'html': {
// 									results.html
// 								},
// 								'css': results.css,
// 								'js': results.js,
// 								'succ': results[1];
// 							});
							
// 							// add to inTest-database

// 						});
// 					});

		