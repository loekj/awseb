'use strict'

var express = require('express')
var uuid = require('uuid')
var async = require('async')
var math = require('math')
var promiseLib = require('when')

var utils = require('../../misc/utils.js')
var db = require('../database/database.js')
var logger = require('../../log/logger.js')

var log = logger.getLogger()

var gaussian = require('free-gaussian')
var bounds = require('binary-search-bounds')

var HYPER_MULT = 1
var KL_NUMERICAL_BINS = 5

/*
ONLY WORKS FOR CATEGORICAL FEATURES AS OF NOW. NUMERICAL IMPLEMENTATION IS INCORRECT. 
ONLY USE IF ALL FEATURE TYPES ARE CATEGORICAL.
*/
exports.trainFWNB = function(exp_uuid, callback) {

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

		// init counters
		var i, j, k

		// Init containers
		for (i = 0; i < variations.length; i++) {
			fit[variations[i]] = []
			cats[i] = []
		}

		/* 
		Check here for high correlated features later??
		data_arr.forEach(function(val) {
			// do stuff
		})
		*/
		var n_valid_obs = 0
		data_arr.forEach(function(val) {
			// Skip if subject in test or result === nul (timeout)
			if (utils.isDef(val.result) && val.result !== "0") { // "0" is failed succ. func
			//if ("0" === "0") { // "0" is failed succ. func				
				// skip all 'who cares' results, since we only focus on data conditioned on y=1

				n_valid_obs++
				var userData = val.userData

				// Increment for prior counts of variations
				if (utils.isDef(prior[val.variation])) {
					prior[val.variation]++
				} else {
					prior[val.variation] = 2 // including laplace
				}

				// Iterate over each feature to construct CPT
				for (j = 0; j < feature_type.length; j++) {
					if (feature_type[j] === "0") { //categorical

						// First time encountering this variable (categorical -> init dict)
						if (!utils.isDef(fit[val.variation][j])) {
							fit[val.variation][j] = {}
						}
						if (utils.isDef(fit[val.variation][j][userData[j]])) {
							fit[val.variation][j][userData[j]]++

						// First time iterating over feature for variation, init count + laplace
						} else {
							fit[val.variation][j][userData[j]] = 2
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

		Object.keys(fit).forEach(function(key) {
			for (i = 0; i < fit[key].length; i++) {
				if (!Array.isArray(fit[key][i])) {
					// Apply Laplace smoothing for zero vals, add one
					if (Object.keys(fit[key][i]).length != cats[i].length) {
						cats[i].forEach(function (element) {
							if (!utils.isDef(fit[key][i][element])) {
								fit[key][i][element] = 1
							}
						})
					}
				}
			}
		})


		// Calculate prior probs here (laplace smoothing)
		Object.keys(prior).forEach(function(key) {
			prior[key] /= (n_valid_obs + variations.length)
		})

		// Sort the numerical vectors, convenient for later
		Object.keys(fit).forEach(function(key) {
			for (i = 0; i < fit[key].length; i++) {
				if (Array.isArray(fit[key][i])) { //numerical
					fit[key][i].sort(function(a,b) {return a-b})
				}
			}
		})

		// Calculate PER FEATURE the weights. For i=0:(#features)
		// If categorial: loop through j classes, for each class, loop over variation for KL (decomposed form) and use log prior with that. 
		// If numerical: Get rid of outliers, and divide in h bins (10?) and do the same
		var n_feat_val
		var prob_var_cond_classval
		var KL_feat_weighted
		var sum_entropy
		var sum_infgain
		var weights = []
		var feat_split

		var numerical_feat_arr
		var numerical_feat_arr_mean
		var numerical_feat_arr_variance
		var distrib
		var bound_idx
		var ppf_arr
		for (i = 0; i < feature_type.length; i++) {
			if (feature_type[i] === "0") {
				// calculate KL for each feature, averaging over feature values
				KL_feat_weighted = 0
				feat_split = 0
				cats[i].forEach(function(feat_val) {
					n_feat_val = 0
					Object.keys(fit).forEach(function(var_key) {
						n_feat_val += fit[var_key][i][feat_val]-1
					})

					// For each variation (with Laplace smoothing)
					sum_entropy = 0
					sum_infgain = 0
					Object.keys(fit).forEach(function(var_key) {
						prob_var_cond_classval = fit[var_key][i][feat_val] / (n_feat_val + variations.length)

						sum_entropy += prob_var_cond_classval * math.log(prob_var_cond_classval) 
						sum_infgain += prob_var_cond_classval * math.log(prior[var_key])
					})
					KL_feat_weighted += (n_feat_val / n_valid_obs) * (sum_entropy - sum_infgain)
					feat_split -= (n_feat_val / n_valid_obs) * math.log(n_feat_val / n_valid_obs)
				})
				weights.push(KL_feat_weighted / (HYPER_MULT * feat_split))
			} else {
				// delete outliers in concatened array over fit[keys]! And assining bins
				numerical_feat_arr = []
				Object.keys(fit).forEach(function(var_key) {
					numerical_feat_arr = numerical_feat_arr.concat(fit[var_key][i])
				})

				// Sort the numerical vectors
				numerical_feat_arr.sort(function(a,b) {return a-b})
							
				// assuming here it is already de-outlierized (or don't remove outliers? depends on size obs?)
				numerical_feat_arr_mean = utils.mean(numerical_feat_arr)
				numerical_feat_arr_variance = utils.variance(numerical_feat_arr)

				distrib = gaussian(numerical_feat_arr_mean, numerical_feat_arr_variance)
				ppf_arr = []
				for (k = 1; k < KL_NUMERICAL_BINS; k++) {
					ppf_arr.push(distrib.ppf(k / KL_NUMERICAL_BINS))
				}

				// calculate KL for each feature, averaging over feature values
				KL_feat_weighted = 0
				feat_split = 0
				//console.log(numerical_feat_arr)
				for (k = 0; k < ppf_arr.length + 1; k++) {
					if (k === 0) {
						n_feat_val = bounds.le(numerical_feat_arr, ppf_arr[0]) + 1
					} else if (k === ppf_arr.length) {
						n_feat_val = bounds.gt(numerical_feat_arr, ppf_arr[k-1])
					} else {
						n_feat_val = bounds.le(numerical_feat_arr, ppf_arr[k]) - bounds.le(numerical_feat_arr, ppf_arr[k-1])
					}
					// For each variation (with Laplace smoothing)
					sum_entropy = 0
					sum_infgain = 0
					Object.keys(fit).forEach(function(var_key) {
						if (k === 0) {
							prob_var_cond_classval = (bounds.le(fit[var_key][i], ppf_arr[0]) + 2) / (n_feat_val + KL_NUMERICAL_BINS)
						} else if (k === ppf_arr.length) {
							prob_var_cond_classval = ( bounds.gt(fit[var_key][i], ppf_arr[k-1]) + 1 ) / (n_feat_val + KL_NUMERICAL_BINS)
						} else {
							prob_var_cond_classval = (bounds.le(fit[var_key][i], ppf_arr[k]) - bounds.le(fit[var_key][i], ppf_arr[k-1]) + 1) / (n_feat_val + KL_NUMERICAL_BINS)
						}
						//console.log(prob_var_cond_classval)
						sum_entropy += prob_var_cond_classval * math.log(prob_var_cond_classval) 
						sum_infgain += prob_var_cond_classval * math.log(prior[var_key])
					})	
					KL_feat_weighted += (n_feat_val / n_valid_obs) * (sum_entropy - sum_infgain)
					feat_split -= (n_feat_val / n_valid_obs) * math.log(n_feat_val / n_valid_obs)
				}
				weights.push(KL_feat_weighted / (HYPER_MULT * feat_split))
			}
		}

		// normalize weights
		var sum_weights = weights.reduce(function(a,b) {return a+b})
		weights = weights.map(function(val) {return val / sum_weights})


		// numerical features array is already de-outlierized
		Object.keys(fit).forEach(function(key) {
			var i
			for (i = 0; i < fit[key].length; i++) {
				if (Array.isArray(fit[key][i])) { //numerical
					fit[key][i] = [utils.mean(fit[key][i]), utils.variance(fit[key][i])]

				} else {

					// Apply Laplace smoothing for zero vals, add one
					if (Object.keys(fit[key][i]).length != cats[i].length) {
						cats[i].forEach(function (element) {
							if (!utils.isDef(fit[key][i][element])) {
								fit[key][i][element] = 1
							}
						})
					}

					// Categorical, so get total sum first with Laplace smoother
					var total = 1
					Object.keys(fit[key][i]).forEach(function(element) {
						total += fit[key][i][element]
					})
					// Then divide each count by total and logarithm the probability
					Object.keys(fit[key][i]).forEach(function(element) {
						fit[key][i][element] = math.log(fit[key][i][element] / (total + Object.keys(fit[key][i]).length))
					})
				}
			}
		})

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
						type : 'FWNB',
						modified : Date.now(),
						fit : fit,
						weights : weights,
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
		exports.trainFWNB(process.argv[2], function(err, result) {
			process.exit(1)
			// IF NOT ERR, FLUSH MODULE_ID FROM CACHE (or aply invalid tag)!
		})
	})
}