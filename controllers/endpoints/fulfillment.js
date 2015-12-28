"use strict";

var express = require('express');
var uuid = require('uuid');
var math = require('math');
var promiseLib = require('when');

var PythonShell = require('python-shell');

var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://localhost:27017/test';

var logger = require('../../log/logger.js')

var log = logger.getLogger();

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	var callb = req.body.callback;
	var userData = req.body.userData;
	var modules_array = req.body.modules;
	if(modules_array.length === undefined) {
		res.json({error: 'No modules present in request.'});
	}
	var modulePromiseArray = getModulePromises(modules_array, userData);

	promiseLib.all(modulePromiseArray)
	.then(function(modules) {
		res.json({content: modules});
	}).catch(function(err) {
		log.error(err.message);
		res.json({err: err});
		throw err;
	});
};

function getModulePromises(moduleArray, userData) {
	var modulePromiseArray = [];
	var module;
	var modulePromise;
	var i;
	for(i=0; i < moduleArray.length; i++) {
		module = moduleArray[i];
		if (module.activeVariation === 'null') {
			// User isn't already in test:
			log.info("Not in variation. Either add to one, or deliver winner.");
			modulePromise = getDbEntry('modules', module.experimentUuid)
				.then(function(module) {
					console.log('getDbEntry result:', module);
					return getTestIdOrWinningVariation(module, userData);
				});

			modulePromiseArray.push(modulePromise);
		} else {
			// User is already in test. Deliver consistent variation to them:
			log.info("ALREADY IN TEST: FEED ACTIVE VARIATION");
			console.log('module.activeVariation',module.activeVariation);
			modulePromise = getDbEntry('variations', module.activeVariation);
			modulePromiseArray.push(modulePromise);
		}
	}
	return modulePromiseArray;
}

function getTestIdOrWinningVariation(module, userData) {
	console.log('waitin',module);
	// Get random number
	var addUserToTest = (Math.random() * 100 <= parseInt(module.percentToInclude * 100));
	var variationId;
	if(addUserToTest === true) {
		log.info("TEST SUBJECT: RANDOM VAR");
		//Test person! Select random variation 
		variationId = getRandomVariationId(module.variations);
		return getDbEntry('variations', variationId).then(function(variation) {
			variation.tests = module.tests;
			addUserToInTestDB(variation);
			return variation;
		});
	} else {
		log.info("NON-TEST SUBJECT: PREDICT WINNING");
		// predict variation by machine learning
		// fetch corresponding test function
		variationId = predictVariation(module._id, userData);
		return getDbEntry('variations', variationId);
	}
}

function getRandomVariationId(variations) {
	var keyIndex = Math.round(Math.random() * variations.length);
	var variationId = variations[keyIndex];
	return variationId;
}

function addUserToInTestDB(variationObj) {
	var args = {
		'testUuid' : variationObj.test_uuid,
		'variationUuid' : variationObj.variation_uuid,
		'expUuid' : variationObj.exp_uuid
	};
	var url = dbUrl + 'users';
	MongoClient.connect(url, function(err, db) {
		db.collection('users').insertOne(args, function(err, db) {
			if(err) {
				log.info("failed to add test subject to DB: ", err);
			}
			db.close();
		});
	});
}

function getDbEntry(collectionName, id) {
	return promiseLib.promise(function(resolve, reject) {
		MongoClient.connect(dbUrl, function(err, db) {
			if(err !== null) {
				reject("Failed to retrieve entry from DB. Error:", err);
			}
			db.collection(collectionName).findOne({_id: id}).then(function(result) {
				console.log('db results: ', {id: id, result: result, collectionName, collectionName})
				resolve(result);
				db.close();
			});
		});
	});
}

function predictVariation(exp_uuid, inputs) {
	return promiseLib.promise(function(resolve, reject) {		
		var options = {
			mode: 'text',
			pythonPath: '/usr/bin/python2.7',
			pythonOptions: ['-u'],
			scriptPath: __dirname + '/../ai',
			args: inputs
		};
		PythonShell.run('gradientBoosting.py', options, function (err, variationId) {
			resolve(variationId);
		});
	});
}