"use strict"

var express = require('express')
var uuid = require('uuid')
var async = require('async')
var math = require('math')
var promiseLib = require('when')

var utils = require('../../misc/utils.js')
var db = require('../database/database.js')
var logger = require('../../log/logger.js')

var log = logger.getLogger()

/*
Dumb training model, everything in memory for now
*/
exports.trainNB = function(exp_uuid, callback) {

	var module_id = new db.mongo.ObjectID(exp_uuid)
	var module_promise = db.mongo.modules.findOne({
		'_id' : module_id
	})
	var data_promise = db.mongo.data.findOne({
		'_moduleId' : module_id
	})

	// Fetch both entries in parallel
	promiseLib.join(module_promise, data_promise).then(function(result) {

		var variations = result[0].variations
		var feature_type = result[0].featureType
		var data_arr = result[1].data

		var fit = {}
		var prior = {}
		var totals = {}
		var cats = []
		var i, j

		// Init containers
		for (i = 0; i < variations.length; i++) {
			fit[variations[i]] = []
			cats[i] = []
		}

		/* 
		Check here for high correlated features later
		data_arr.forEach(function(val) {
			// do stuff
		})
		*/
		var n_valid_obs = 0
		data_arr.forEach(function(val) {
			// Skip if subject in test or result === nul (timeout)
			if (utils.isDef(val.result) && val.result !== "0") { // "0" is failed succ. func
			// if (!utils.isDef(val.result) || val.result === "0") { // "0" is failed succ. func
			// 	//continue do nothing for now as we have no collections yet, only test data sent out.
			// }
				n_valid_obs++
				var userData = val.userData

				// Increment for prior counts of variations
				if (utils.isDef(prior[val.variation])) {
					prior[val.variation]++
				} else {
					prior[val.variation] = 1 // TODO: including laplace?
				}			

				// Iterate over each feature
				for (j = 0; j < feature_type.length; j++) {
					if (feature_type[j] === "0") { //categorical

						// First time encountering this variable (categorical -> init dict)
						if (!utils.isDef(fit[val.variation][j])) {
							fit[val.variation][j] = {}
						}
						if (utils.isDef(fit[val.variation][j][userData[j]])) {
							fit[val.variation][j][userData[j]]++

						// First time iterating over feature for variation, init count
						} else {
							fit[val.variation][j][userData[j]] = 1 // TODO: including laplace?
						}

						// keep track of all classes for the categorical features
						if (cats[j].indexOf(userData[j]) === -1) {
							cats[j].push(userData[j])
						}

					} else { //numerical

						// Keep track of all values, to calc mean and variance later
						if (utils.isDef(fit[val.variation][j])){
							fit[val.variation][j].push(parseFloat(userData[j]))

						// First time iterating over feature, init array
						} else {
							fit[val.variation][j] = [parseFloat(userData[j])]
						}
					}
				}
			}
		})

		if (Object.keys(prior).length != variations.length) {
			log.error("Not all variations are served or recorded in module yet.")
		}

		// Calculate prior probs here TODO: laplace smoothing?
		Object.keys(prior).forEach(function(key) {
			prior[key] /= n_valid_obs
		})

		Object.keys(fit).forEach(function(key) {
			var i
			for (i = 0; i < fit[key].length; i++) {
				if (Array.isArray(fit[key][i])) { //numerical
					fit[key][i] = [utils.mean(fit[key][i]), utils.variance(fit[key][i])]

				} else {

					// Apply Laplace smoothing, add one
					if (Object.keys(fit[key][i]).length != cats[i].length) {
						cats[i].forEach(function (element) {
							if (!utils.isDef(fit[key][i][element])) {
								fit[key][i][element] = 1
							}
						})
					}

					// Categorical, so get total sum first
					var total = 0
					Object.keys(fit[key][i]).forEach(function(element) {
						total += fit[key][i][element]
					})

					// Then divide each count by total and logarithm the probability
					Object.keys(fit[key][i]).forEach(function(element) {
						fit[key][i][element] = math.log(fit[key][i][element] / total)
					})					
				}
			}
		})

		// map to log here
		Object.keys(prior).forEach(function(key) {
			prior[key] = math.log(prior[key])
		})

		// Store the fitted model and update the modified timestamp
		db.mongo.modules.update(
			{
			'_id' : module_id
			},
			{
				$set : {
					model : {
						type : 'NB',
						modified : Date.now(),
						fit : fit,
						prior : prior
					}
				}
			},
			function(err, result) {
				if (err) {
					log.error(exp_uuid + " is NOT successfully trained.")
					callback(err)
				} else {
					log.info(exp_uuid + " is trained.")
					db.redis.del(module_id, function(err, result_cache) {
						if (err) {
							log.error(err)
						}
						callback(null, result)
					})	
				}
			}
		)
	})
}

// if root/train_local.sh is run
if (require.main === module) {
	db.connect(function(err) {
		if (err) {
			throw err
		}
		exports.trainNB(process.argv[2], function(err, result) {
			process.exit(1)
			// IF NOT ERR, FLUSH MODULE_ID FROM CACHE (or aply invalid tag??)!
		})
	})
}