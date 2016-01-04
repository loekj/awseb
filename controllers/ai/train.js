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
exports.trainNB = function(exp_uuid) {

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

		data_arr.forEach(function(val) {
			// Skip if subject in test or result === nul (timeout)
			if (!utils.isDef(val.result) || val.result === "0") { // "0" is failed succ. func
				continue
			}

			var userData = val.userData

			// Iterate over each feature
			for (j = 0; j < feature_type.length; j++) {
				if (feature_type[j] === "0") { //categorical


					if (utils.isDef(fit[val.variation][j])) {
						if (utils.isDef(fit[val.variation][j][userData[j]])) {
							fit[val.variation][j][userData[j]]++

						// First time iterating over feature for variation, init count
						} else {
							fit[val.variation][j][userData[j]] = 1
						}

						// keep track of all classes for the categorical features
						if (cats[j].indexOf(userData[j]) === -1) {
							cats[j].push(userData[j])
						}

					// First time iterating over feature, init dict
					} else {
						fit[val.variation][j] = {}
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

		// Store the fitted model and update the modified timestamp
		db.mongo.modules.update(
			{
			'_id' : module_id
			},
			{
				$set : {
					'modified' : Date.now(),
					'fit' : fit
				}
			},
			function(err, result) {
				if (err) {
					return 0
				}
				return 1
			}
		)
	})
}