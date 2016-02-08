"use strict"

var express = require('express')
var promiseLib = require('when')

var math = require('math')
var mathjs = require('mathjs')

var utils = require('../../misc/utils.js')
var db = require('../database/database.js')
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
		res.status(200).json({content: modules})
	}).catch(function(err) {
		log.error("Variations did not compile: ", err)
		res.status(400).json({err: err})
	})
}

function getVariationPromises(moduleArray, userData) {
	var variationPromiseArray = []
	var module
	var i
	for(i=0; i < moduleArray.length; i++) {
		module = moduleArray[i]
		if (!utils.isDef(module.activeVariation)) {
			// User isn't already in test:
			console.log("EXPUUID: " + module.expUuid)
			variationPromiseArray.push(
				getDbEntry(db.mongo.modules, module.expUuid)
				.then(function(module) {
					return getTestIdOrWinningVariation(module, userData)
				}).catch(function(err) {
					throw err
				})
			)
		} else {
			// User is already in test. Deliver consistent variation to them:
			console.log("ALREADY IN TEST: FEED ACTIVE VARIATION")
			variationPromiseArray.push(
				getDbEntry(db.mongo.variations, module.activeVariation)
			)
		}
	}
	return variationPromiseArray
}

function getTestIdOrWinningVariation(module, userData) {
	// Get random number
	var addUserToTest = (math.random() * 100 <= parseInt(module.prop))
	var variationId
	var predictPromise
	var test_uuid
	if(addUserToTest === true || !utils.isDef(module.model)) { //fit does not exist if not trained yet
		console.log("TEST SUBJECT: RANDOM VAR")
		//Test person! Select random variation
		console.log("VARIATIONS DEFINED?: " + JSON.stringify(typeof module.variations))
		console.log(module.variations)
		variationId = getRandomVariationId(module.variations)
		console.log("RAND VAR: " + variationId)
		return getDbEntry(db.mongo.variations, variationId).then(function(variation) {
			var res_obj = {
					moduleUuid : module._id,
					code : {
						html : variation.html,
						css : variation.css,
						js : variation.js
					},
					tests : module.succ
				}
			test_uuid = new db.mongo.ObjectID()
			res_obj.testUuid = test_uuid
			addUserToInTestDB(module._id, userData, variation._id, test_uuid)
			return res_obj
		}).catch(function(error) {
			console.log("ERROR: ", JSON.stringify(error))
		})

	} else {
		console.log("NON-TEST SUBJECT: PREDICT WINNING")
		// predict variation by machine learning
		// fetch corresponding test function
		if (module.succ.TestSuccFn.depVarType === 'binary') {
			if (module.model.type === 'FWNB') {
				predictPromise = predictVariationFWNB(module, userData)
			} else if (module.model.type === 'NB') {
				predictPromise = predictVariationNB(module, userData)
			} else {
				predictPromise = predictVariationNB(module, userData)
			}
		} else if (module.succ.TestSuccFn.depVarType === 'mclass') {
			predictPromise = predictVariationMCLASS(module, userData)
		} else {//(module.succ.depVarType === 'num') {
			predictPromise = predictVariationREGR(module, userData)
		}
		return predictPromise.then(function(variationId) {
			console.log('Predicted variation ID: ', variationId)
			return getDbEntry(db.mongo.variations, variationId)
		}).catch(function(error) {
			// Serve random variation
			console.log("ERROR IN PREDICTING. SERVING RANDOM VARIATION.")
			variationId = getRandomVariationId(module.variations)
			return getDbEntry(db.mongo.variations, variationId)
				.then(function(variation) {
					var res_obj = {
							moduleUuid : module._id,
							code : {
								html : variation.html,
								css : variation.css,
								js : variation.js
							},
							tests : module.succ
						}
					test_uuid = new db.mongo.ObjectID()
					res_obj.testUuid = test_uuid
					addUserToInTestDB(module._id, userData, variation._id, test_uuid)
					return res_obj
				})			
		})
	}
}

function getRandomVariationId(variations) {
	var keyIndex = mathjs.randomInt(variations.length)
	console.log("KEYINDEX: " + JSON.stringify(keyIndex))
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
					'variation' : varId
				}
			}
		},
		{
			upsert : true
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
				log.error("Not found redis key " + id)
			}
			if (utils.isDef(result)) { //exist in cache
				resolve(JSON.parse(result))
			} else { //does not exist in cache
				console.log("NOT IN CACHE")
				var obj_id = new db.mongo.ObjectID(id)
				collection.findOne({
					'_id' : obj_id
				}).then(function(result) {
					console.log("id: " + id)
					console.log("result: ", JSON.stringify(result))
					if (!utils.isDef(result)) {
						reject("Id " + id + " not found")
					}
					resolve(result)
					db.redis.set(id, JSON.stringify(result), function(err, result) {
						if (err) {
							log.error("Redis not set key id " + id)
						}
						log.info("Cached " + id)
					})
				})
			}
		})
	})
}

/*
In future guard for overflow, check whether key exist in fit model 
(maybe it is a new class not present in fitted model yet). If any of these issues arise, call callback
*/
function predictVariationNB(module, inputs) {
	return promiseLib.promise(function(resolve, reject) {
		var max_score = Number.NEGATIVE_INFINITY
		var max_var_id
		//must be defined, otherwise random var branch would be executed
		
		//forEach is sync, so should work.
		Object.keys(module.model.fit).forEach(function(key){
			var i = 0
			var prob = 0
			module.model.fit[key].forEach(function(feature) {
				if (Array.isArray(feature)) { //numerical
					var feature_val = parseFloat(inputs[i])
					if (Object.is(feature_val), NaN || !utils.isDef(feature_val)) {
						log.error("Non-numerical passed in fitted model.")
						throw TypeError("Non-numerical passed in fitted model.")
					}		
					prob += -0.5 * math.log(2 * Math.PI * feature[1]) - math.pow(feature_val - feature[0], 2) / (2 * feature[1])
				} else { //categorical
					var prob_feature = feature[inputs[i]]
					if (!utils.isDef(prob_feature)) {
						log.error("Feature class not known or accessing out of bounds array in fitted model.")
						throw TypeError("Feature class not known in fitted model.")
					}
					prob += feature[inputs[i]]
				}
				i++
			})
			prob += module.model.prior[key]
			if (prob > max_score) {
				max_score = prob
				max_var_id = key
			}
		})
		resolve(max_var_id)
	})
}

/*
* Feature Weighted NB
*/
function predictVariationFWNB(module, inputs) {
	return promiseLib.promise(function(resolve, reject) {
		var max_score = Number.NEGATIVE_INFINITY
		var max_var_id
		//must be defined, otherwise random var branch would be executed
		
		//forEach is sync, so should work.
		Object.keys(module.model.fit).forEach(function(key){
			var i = 0
			var prob = 0
			module.model.fit[key].forEach(function(feature) {
				if (Array.isArray(feature)) { //numerical
					var feature_val = parseFloat(inputs[i])
					if (Object.is(feature_val), NaN || !utils.isDef(feature_val)) {
						log.error("Non-numerical passed in fitted model.")
						throw TypeError("Non-numerical passed in fitted model.")
					}		
					prob += module.model.weights[i] * (-0.5 * math.log(2 * Math.PI * feature[1]) - math.pow(feature_val - feature[0], 2) / (2 * feature[1]) )
				} else { //categorical
					var prob_feature = feature[inputs[i]]
					if (!utils.isDef(prob_feature)) {
						log.error("Feature class not known or accessing out of bounds array in fitted model.")
						throw TypeError("Feature class not known in fitted model.")
					}
					prob += module.model.weights[i] * feature[inputs[i]]
				}
				i++
			})
			prob += module.model.prior[key]
			if (prob > max_score) {
				max_score = prob
				max_var_id = key
			}			
			console.log("ITER FOR LOOP PREDICT")
		})
		console.log("ENDED FOR")
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
