"use strict";

exports.isDef = function(obj) {
	if (typeof obj === 'undefined' || obj === null) {
		return false;
	}
	return true;
}

exports.dashToUnder = function(str) {
	return str.replace(/-/g,'_');
}