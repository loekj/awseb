"use strict"
var promiseLib = require('when')
var async = require('async')

function predictVariationGLM_ElNet(module, inputs) {

	return promiseLib.promise(function(resolve, reject) {
		let max_predict = Number.NEGATIVE_INFINITY
		let max_predict_var_id,
			var_pars,
			var_input,
			var_predict
		
		let featureTypes = module.featureType
		let catLevels = module.model.levels

		//model.fit must be defined, otherwise random var branch would be executed
		async.forEach(Object.keys(module.model.fit), function(key, callback){
			var_pars = module.model.fit[key]
			var_predict = var_pars.shift()
			featureTypes.forEach(function(feature, idx) {
				if (feature === "0") { // categorical
					var_input = var_pars[idx][inputs[idx]]
					if (var_input === undefined) {
						contains(catLevels[idx], inputs[idx], function(err, result) {
								if (err) {
									console.log("ERROR")
								}
								if (result === -1) {
									console.log("WARNING: level not found: " + inputs[idx])
								}
							})
					} else {
						var_predict += var_input
					}
				} else {
					var_predict += (var_pars[idx] * inputs[idx])
				}
			})
			if (var_predict > max_predict) {
				max_predict = var_predict
				max_predict_var_id = key
			}
		})
		resolve(max_predict_var_id)
	})
}	

function contains(a, obj, callback) {
	let exists = false
	try {
		for (let i = 0; i < a.length; i++) {
			if (a[i] === obj) {
				callback(null, i)
				exists = true
			}
		}
	} catch(err) {
		callback(err)
	}
	if (!exists) {
		callback(null, -1)
	}
}

if (require.main === module) {
	let dummy_data = {
		featureType: [ 
			'0',
			'0',
			'1',
			'0',
			'0',
			'1',			
		],
		model: {
			levels: [	['1','0'],
						['1','0'],
						[],
						['1','0'],
						['1','0'],
						[]
			],
			fit: {
				'56b6d7fc21ac3dfc68bab7ab': [
					0.34,
					{ '1': 1.32},
					{ '1': 3.02},
					-2.3,
					{'1': 3.1},
					{'1': -0.5},
					0.64
				],
				'56b6d80021ac3dfc68bab7ac': [
					10.34,
					{ '1': -1.32},
					{ '1': 5.02},
					2.3,
					{'1': 4.1},
					{'1': -1.5},
					2.64
				],
				'56b6d80521ac3dfc68bab7ad': [
					-1.34,
					{ '1': 0.32},
					{ '1': 5.02},
					-2.3,
					{'1': 8.1},
					{'1': 4.5},
					0.64
				]								
			}
		}
	}

	let user_input = [
		'1',
		'0',
		124,
		'1',
		'0',
		3
	]
	predictVariationGLM_ElNet(dummy_data, user_input).then((result) => console.log(result))
}
