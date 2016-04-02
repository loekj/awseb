"use strict";
var math = require('math')

exports.isDef = function(obj) {
	if (typeof obj === 'undefined' || obj === null || obj === 'null') {
		return false;
	}
	return true;
}

exports.dashToUnder = function(str) {
	return str.replace(/-/g,'_');
}

exports.mean = function(arr) {
	var size = arr.length
	return arr.reduce( (prev, curr) => prev + curr, 0) / arr.length
}

exports.variance = function(arr) {
	if (arr.length < 2) {
		return 0
	}
	var avg = exports.mean(arr)
	var sum_squares = 0
	arr.forEach(function (val) {
		sum_squares += math.pow(val - avg, 2)
	})
	return sum_squares / (arr.length-1)
}

exports.contains = function(a, obj, callback) {
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