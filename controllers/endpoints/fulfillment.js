"use strict";

var express = require('express');
var uuid = require('uuid');
var async = require('async');
var math = require('math');


var utils = require('../../misc/utils.js');
var db = require('../database/database.js');
var logger = require('../../log/logger.js');
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
	var modulesArray = req.body.modules;
	if(modulesArray.length === undefined) {
		res.json({error: 'No modules present in request.'});
	}
	var variationPromiseArray = getVariationPromises(modulesArray, userData);

	promiseLib.all(variationPromiseArray)
	.then(function(modules) {
		res.json({content: modules});
	}).catch(function(err) {
		log.error("Variations did not compile: ",err.message);
		res.json({err: err});
		throw err;
	});
};

function getVariationPromises(moduleArray, userData) {
	var variationPromiseArray = [];
	var module;
	var modulePromise;
	var i;
	for(i=0; i < moduleArray.length; i++) {
		module = moduleArray[i];
		if (module.activeVariation === 'null') {
			// User isn't already in test:
			console.log("Not in variation. Either add to one, or deliver winner.");
			modulePromise = getDbEntry('modules', module.experimentUuid)
				.then(function(module) {
					console.log('getDbEntry result:', module);
					return getTestIdOrWinningVariation(module, userData);
				});

			variationPromiseArray.push(modulePromise);
		} else {
			// User is already in test. Deliver consistent variation to them:
			console.log("ALREADY IN TEST: FEED ACTIVE VARIATION");
			console.log('module.activeVariation',module.activeVariation);
			modulePromise = getDbEntry('variations', module.activeVariation);
			variationPromiseArray.push(modulePromise);
		}
	}
	return variationPromiseArray;
}

function getTestIdOrWinningVariation(module, userData) {
	// Get random number
	var addUserToTest = (Math.random() * 100 <= parseInt(module.percentToInclude * 100));
	var variationId;
	if(addUserToTest === true) {
		console.log("TEST SUBJECT: RANDOM VAR");
		//Test person! Select random variation 
		variationId = getRandomVariationId(module.variations);
		return getDbEntry('variations', variationId).then(function(variation) {
			variation.tests = module.tests;
			addUserToInTestDB(variation);
			return variation;
		});
	} else {
		console.log("NON-TEST SUBJECT: PREDICT WINNING");
		// predict variation by machine learning
		// fetch corresponding test function
		return predictVariation(module._id, userData).then(function(variationId) {
			console.log('Predicted variation ID: ', variationId);
			return getDbEntry('variations', variationId);
		});
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

	// MongoClient.connect(url, function(err, db) {
	// 	db.collection('users').insertOne(args, function(err, db) {
	// 		if(err) {
	// 			console.log("failed to add test subject to DB: ", err);
	// 		}	
	// 		db.close();
	// 	})
	// });
}

function getDbEntry(collectionName, id) {
	return promiseLib.promise(function(resolve, reject) {
		MongoClient.connect(dbUrl, function(err, db) {
			if(err !== null) {
				reject("Failed to retrieve entry from DB. Error:", err);
			}			
			var dbPromise = db.collection(collectionName).findOne({_id: id});
			console.log('db Promise: ', dbPromise);
			dbPromise.then(function(result) {
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