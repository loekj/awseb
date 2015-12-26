"use strict";

var express = require('express');
var uuid = require('uuid');
var async = require('async');
var math = require('math');


var utils = require('../../misc/utils.js');
//var except = require('../../misc/exceptions.js');

var PythonShell = require('python-shell');
var db = require('../database/database.js');
var logger = require('../../log/logger.js');

var connection = db.connect();
var log = logger.getLogger();

var DEFAULT_SUCCUUID = [
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

	var modulePromiseArray = [];
	var modulePromise;

	for(var i=0; i < modules_arr.length; i++) {
		var exp_uuid = modules_arr[i].experimentUuid;
		if (modules_arr[i] && modules_arr[i].activeVariation.toLowerCase() === 'null') {
			log.info("Not in variation. Either add to one, or deliver winner.");
			modulePromise = makeDBCall(exp_uuid).then(getTestOrBestVariation);
			modulePromiseArray.push(modulePromise);
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

	promiseLib.all(modulePromiseArray)
	.then(compileModules)
	.then(function(modules) {
		res.json(modules);
	}).catch(requestError);

};

// makeDBCall -> predictVariation --> getVariation
function makeDBCall(exp_uuid) {
	return promiseLib.promise(function(resolve, reject) {
		// person is not in test yet. decide if in test or feed winning
		var args = {
			expUuid : exp_uuid
		};
		var queryString = 'SELECT prop, numVar, succUuid FROM experiments WHERE ?';
		connection.query(queryString, args, function(err, rows, fields) {
			if(err) {
				reject(err);
			} else {
				resolve({rows:rows, fields:fields, exp_uuid: exp_uuid});
			}
		})
	});
}

function getTestOrBestVariation(dbReturn) {
	var rows = dbReturn.rows;
	var fields = dbReturn.fields;
	var exp_uuid = dbReturn.exp_uuid;
	var variationPromise;
	var successPromise;
	var modulePromise;
	console.log('rows:',rows,'fields',fields);
	var test_uuid = uuid.v4();
	// Get random number
	var userInTest = (math.random()*100 <= parseInt(rows[0].prop,10));
	if (userInTest === true) {
		log.info("TEST SUBJECT: RANDOM VAR");

		//Test person! Select random variation
		variationPromise = getRandomVariation(exp_uuid);

		//Get successes for variation:
		successPromise = getSuccesFn(rows[0].succUuid);

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

function compileModules(results) {
	var modules = [];
	var variation_uuid = results[0].variationUuid;
	var responseObj;
	for(var i=0; i<results.length; i++) {
// If user is being entered into test:
		if(typeof results[i].then === 'function') {
			results[i].then(function(variationObj, successObj) {
				responseObj = getResponseObj(variationObj, successObj)
				modules.push();

				// add to in-test database
				addUserToTestDB(variationObj, exp_uuid);
			});
		} else {
// User in test or gets winning variation:
			log.info(JSON.stringify(results));
			responseObj = getResponseObj(results[i]);
			modules.push(responseObj);		
		}
	}
	return modules;
}

function getResponseObj(variationObj, successObj) {
	return {
		'testUuid': variationObj.test_uuid,
		'html': [
			variationObj.html
		],
		'css': variationObj.css,
		'js': variationObj.js,
		'succ': successObj || null
	}
}

function addUserToInTestDB(variationObj) {
	var args = {
		'testUuid' : variationObj.test_uuid,
		'variationUuid' : variationObj.variation_uuid,
		'expUuid' : variationObj.exp_uuid
	}
	var queryString = 'INSERT INTO ' + variationObj.exp_uuid + '_intest SET ?';
	connection.query(queryString, args, function(err, rows, fields) {
		if (err) {
			log.error(err.message, 'Query insert intest');
			throw err;
		}
		log.info({'Rows affected' : rows.affectedRows}, 'Insert ' + variationObj.test_uuid + 'into intest');
	});	
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



/************************
 	In Test Functions:
 ************************/
function getSuccesFn(succUuid) {
	return promiseLib.promise(function(resolve, reject) {
		var tmp_succUuid = null;
		var args;
		for (var i = 0; i < DEFAULT_SUCCUUID.length; i++ ){
			if (succUuid == DEFAULT_SUCCUUID[i]) {
				tmp_succUuid = succUuid;
				break;
			}
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


