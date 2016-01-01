"use strict"

var express = require('express')
var uuid = require('uuid')
var async = require('async')
var math = require('math')
var promiseLib = require('when')

var utils = require('../../misc/utils.js')
var db = require('../database/database.js')
var logger = require('../../log/logger.js')
var PythonShell = require('python-shell')

var logger = require('../../log/logger.js')

var log = logger.getLogger()

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	var callb = req.body.callback
	var userData = req.body.userData
	var modulesArray = req.body.modules
	if(modulesArray.length === undefined) {
		res.status(400).json({error: 'No modules present in request.'})
	}
	var variationPromiseArray = getVariationPromises(modulesArray, userData)

	promiseLib.all(variationPromiseArray)
	.then(function(modules) {
		res.status(200).json(modules)
	}).catch(function(err) {
		log.error("Variations did not compile: ",err.message)
		res.status(400).json({err: err})
		throw err
	})
}

function getVariationPromises(moduleArray, userData) {
	var variationPromiseArray = []
	var module
	var modulePromise
	var i
	for(i=0; i < moduleArray.length; i++) {
		module = moduleArray[i]
		if (!utils.isDef(module.activeVariation)) {
			// User isn't already in test:
			console.log("Not in variation. Either add to one, or deliver winner.")
			modulePromise = getDbEntry(db.mongo.modules, module.expUuid)
				.then(function(module) {
					//console.log('getDbEntry result:', module)
					return getTestIdOrWinningVariation(module, userData)
				})

			variationPromiseArray.push(modulePromise)
		} else {
			// User is already in test. Deliver consistent variation to them:
			console.log("ALREADY IN TEST: FEED ACTIVE VARIATION")
			//console.log('module.activeVariation',module.activeVariation)
			modulePromise = getDbEntry(db.mongo.variations, module.activeVariation)
			variationPromiseArray.push(modulePromise)
		}
	}
	return variationPromiseArray
}

function getTestIdOrWinningVariation(module, userData) {
	// Get random number
	var addUserToTest = (Math.random() * 100 <= parseInt(module.prop))
	var variationId
	var predictPromise
	var test_uuid
	if(addUserToTest === true || !utils.isDef(module.fit)) { //fit does not exist if not trained yet
		console.log("TEST SUBJECT: RANDOM VAR")
		//Test person! Select random variation 
		variationId = getRandomVariationId(module.variations)
		return getDbEntry(db.mongo.variations, variationId).then(function(variation) {
			test_uuid = uuid.v4()
			addUserToInTestDB(module._id, userData, variation._id, test_uuid)
			variation.succ = module.succ
			variation.testUuid = test_uuid
			return variation
		})
	} else {
		console.log("NON-TEST SUBJECT: PREDICT WINNING")
		// predict variation by machine learning
		// fetch corresponding test function
		if (module.succ.depVarType === 'binary') {
			predictPromise = predictVariationNB(module, userData)
		} else if (module.succ.depVarType === 'mclass') {
			predictPromise = predictVariationMCLASS(module, userData)
		} else {//(module.succ.depVarType === 'num') {
			predictPromise = predictVariationREGR(module, userData)
		}
		return predictPromise.then(function(variationId) {
			console.log('Predicted variation ID: ', variationId)
			return getDbEntry(db.mongo.variations, variationId)
		})
	}
}

function getRandomVariationId(variations) {
	var keyIndex = Math.round(Math.random() * variations.length)
	var variationId = variations[keyIndex]
	return variationId
}

function addUserToInTestDB(experimentId, userData, variationId, test_uuid) {
	var expId = new db.mongo.ObjectID(experimentId)
	var varId = new db.mongo.ObjectID(variationId)
	db.mongo.data.update(
		{
			'_moduleId' : expId
		},
		{
			$push : {
				'data' : 
				{
					'testUuid' : test_uuid,
					'added' : Date.now(),
					'userData' : userData,
					'variation' : varId,
					'result' : null
				}
			}
		},
		function(err, result) {
			if (err) {
				log.error(err)
			}
			log.info(result)
		}
	)
}

function getDbEntry(collection, id) {
	return promiseLib.promise(function(resolve, reject) {	
		db.redis.get(id, function(err, result) {
			if (err) {
				log.error(err)
				reject(err)
			}
			if (result) { //exist in cache
				console.log("EXIST IN CACHE! :D")
				resolve(JSON.parse(result))
			} else { //does not exist in cache
				console.log("NOT EXIST IN CACHE! :(")
				var obj_id = new db.mongo.ObjectID(id)
				var dbPromise = collection.findOne({
					'_id' : obj_id
				})
				//console.log('db Promise: ', dbPromise)
				dbPromise.then(function(result) {
					// add to cache
					//console.log('db  query results: ', {id: id, result: result})
					db.redis.set(id, JSON.stringify(result), function() {
						resolve(result)
					})
				})
			}
		})
	})
}

function LogGauss(x, mean, variance) {
	return (-0.5 * math.log(2 * math.pi * variance) - math.pow(x - mean, 2) / (2 * variance))
}

function predictVariationNB(module, inputs) {
	return promiseLib.promise(function(resolve, reject) {
		var max_score = 0
		var max_var_id
		//must be defined, otherwise random var branch would be executed
		

		//forEach is sync, so should work.
		Object.keys(module.fit).forEach(function(key){
			var i = 0
			var prob = 0
			module.fit[key].forEach(function(feature) {
				if (Array.isArray(feature)) { //numerical
					prob += LogGauss(parseFloat(inputs[i]), feature[0], feature[1])
				} else { //categorical
					prob += feature[inputs[i]]
				}
				i++
			})
			if (prob > max_score) {
				max_score = prob
				max_var_id = key
			}			
		})
		resolve(max_var_id)
	})
}

function predictVariationMCLASS(module, inputs) {
}

function predictVariationREGR(module, inputs) {
}	



/*
OLD PYTHON SHELL SOCKET
*/
	// return promiseLib.promise(function(resolve, reject) {		
	// 	var options = {
	// 		mode: 'text',
	// 		pythonPath: '/usr/bin/python2.7',
	// 		pythonOptions: ['-u'],
	// 		scriptPath: __dirname + '/../ai',
	// 		args: inputs
	// 	}
	// 	PythonShell.run('gradientBoosting.py', options, function (err, variationId) {
	// 		resolve(variationId)
	// 	})
	// })
	//}