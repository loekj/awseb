"use strict";

var express = require('express');
var uuid = require('uuid');
var math = require('math');
var promiseLib = require('when');


var PythonShell = require('python-shell');
var db = require('../database/database.js');
var logger = require('../../log/logger.js')

var connection = db.connect();
var log = logger.getLogger();

var DEFAULT_SUCCUUID = [
	'uuid1',
	'uuid2',
	'uuid3',
	'uuid4',
	'uuid5'
];

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	var callb = req.body.callback;
	var modules_arr = req.body.modules;
	var modulePromiseArray = [];
	var variationPromise;
	var successPromise;
	var modulePromise;

	for(var i=0; i < modules_arr.length; i++) {
		var exp_uuid = modules_arr[i].experimentUuid;
		if (modules_arr[i].activeVariation.toLowerCase() == 'null') {
			// person is not in test yet. decide if in test or feed winning
			var args = {
				expUuid : exp_uuid
			};
			var queryString = 'SELECT prop, numVar, succUuid FROM experiments WHERE ?';
			connection.query(queryString, args, function(err, rows, fields) {
				if (err) {
					log.error(err.message, 'Query get experiment ' + exp_uuid);
					throw err;
				}
				
				var test_uuid = uuid.v4();

				// Get random number
				if (math.random()*100 <= parseInt(rows[0].prop,10)) {
					log.info("TEST SUBJECT: RANDOM VAR");
					//test person! select random variation, fetch results and serve

					variationPromise = getRandomVariation(exp_uuid);
					successPromise = getSuccesFn(rows[0].succUuid);
					modulePromise = promiseLib.join(variationPromise, successPromise);
					modulePromiseArray.push(modulePromise);

				} else {
					log.info("NON-TEST SUBJECT: PREDICT WINNING");
					// run in parallel. Two independent tasks
					// predict variation by machine learning
					// fetch corresponding test function
					//console.log("WHAT IS THIS: " + JSON.stringify(rows));
					//console.log("numVar: %s", rows[0].numVar);
					var inputs = [rows[0].numVar];// ...[, '5', '26', 'job']
					modulePromiseArray.push(predictVariation(exp_uuid, inputs));					
				}
			})
		} else {
			log.info("ALREADY IN TEST: FEED ACTIVE VARIATION");
			// person is already in test, feed already active variation in response!
			modulePromiseArray.push(
				getVariation(modules_arr[i].activeVariation, exp_uuid)
			);
		}
	}


	promiseLib.all(modulePromiseArray).then(function(results) {
		compileModules(results, res);
	}).catch(requestError);

};


function compileModules(results, res) {
	log.info(JSON.stringify(results));
	

	var modules = [];
	var variation_uuid = results[0].variationUuid;
	for(var i=0; i<results.length; i++) {
// If user is being entered into test:
		if(typeof results[i].then === 'function') {
			results[i].then(function(variationObj, succObj) {
				modules.push({
					'testUuid': variationObj.test_uuid,
					'html': [
						variationObj.html
					],
					'css': variationObj.css,
					'js': variationObj.js,
					'succ': succObj
				});

				// add to in-test database
				var args = {
				 'testUuid' : variationObj.test_uuid,
				 'variationUuid' : variationObj.variation_uuid,
				 'expUuid' : variationObj.exp_uuid
				}
				var queryString = 'INSERT INTO ' + exp_uuid + '_intest SET ?';
				connection.query(queryString, args, function(err, rows, fields) {
					if (err) {
						log.error(err.message, 'Query insert intest');
						throw err;
					}
					log.info({'Rows affected' : rows.affectedRows}, 'Insert ' + test_uuid + 'into intest');
				});	
			});
		} else {
// User in test or gets winning variation:
			log.info(JSON.stringify(results));
			modules.push({
				'testUuid': results[i].test_uuid,
				'html': [
					results[i].html
				],
				'css': results[i].css,
				'js': results[i].js,
				'succ': null
			});
			
		}
	}
	res.json(modules);

}

function requestError(err) {
	log.error(err.message, 'Parralel getRandomVariation and getSuccesFn');
	throw err;
}


function getRandomVariation(expUuid) {
	return promiseLib.promise(function(resolve,reject) {
		// This is very slow. Optimize later.
		var queryString = 'SELECT variationUuid, CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM ' + expUuid + '_variations ORDER BY RAND() LIMIT 1';
		connection.query(queryString, function(err, rows, fields) {
			if (err) {
				reject({err: err, errMessage: err.message});
			}
			resolve({
				'variationUuid' : rows[0].variationUuid,
				'html' : rows[0].html,
				'css' : rows[0].css,
				'js' : rows[0].js
			});	
		});		
	});
}

function getVariation(varUuid, expUuid) {
	return promiseLib.promise(function(resolve,reject) {
		var varUuid = 'vuuid1'; // in real-life the python script will feedback var uuid
		var args = {
			variationUuid : varUuid
		}
		var queryString =  'SELECT CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM ' + expUuid + '_variations' + ' WHERE ?';
		connection.query(queryString, args, function(err, rows, fields) {
			if (err) {
				reject({err: err, errMessage: err.message});
			}
			resolve({
				'testUuid': null,
				'html' : rows[0].html,
				'css' : rows[0].css,
				'js' : rows[0].js,
				'succ': null
			});	
		});		
	})
}

/************************
	Non-test Functions:
 ************************/
function predictVariation(exp_uuid, inputs) {
	return promiseLib.promise(function(resolve, reject) {		
		var options = {
				mode: 'text',
				pythonPath: '/usr/bin/python2.7',
				pythonOptions: ['-u'],
				scriptPath: __dirname + '/../ai',
				args: inputs
			};
		PythonShell.run('gradientBoosting.py', options, function (err, results) {
			if (err) {
				reject({err: err, errMessage: err.message});
			} else if (results) {
				//log.info("RESULTS: %s", JSON.stringify(results));
				getVariation(results[0], exp_uuid)
				.then(function(results) {
					resolve(results);
				}).catch(function(err) {
					log.error(err.message, 'Get variation');
					reject({err: err, errMessage: err.message});
				});				
			}
		});
	});
}

function getWinningVariation(err, results) {
	if (err) {
		log.error(err.message, 'Predict variation');
		throw err;
	}						
	var winVarUuid = results[0];
	
}


/************************
 	In Test Functions:
 ************************/
function getSuccesFn(succUuid, callback) {
	return promiseLib.promise(function(resolve, reject) {
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
					reject({err: err, errMessage: err.message});				
				}
				resolve({
					'succUuid': succUuid,
					'succFn': rows[0].fn,
					'arg1': rows[0].argstr1,
					'arg2': rows[0].argstr2,
					'arg3': rows[0].argstr3,
					'arg4': rows[0].argstr4
				});	
			}

		)} else {
			resolve({
				'succUuid': succUuid,
				'succFn': null
			});			
		}	
		
	})
} 


