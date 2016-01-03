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

exports.std = function(arr) {
	if (arr.length < 2) {
		return 0
	}
	var avg = exports.mean(arr)
	var sum_squares = 0
	arr.forEach(function (val) {
		sum_squares += math.pow(val - avg, 2)
	})
	return math.sqrt(sum_squares / (arr.length-1))
}