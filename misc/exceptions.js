'use strict';

var logger = require('../log/logger.js');
//var Error = require('error');
var log = logger.getLogger();

exports.UnchangedError = function (message, extra) {
	log.error({'Error' : message}, extra);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
	this.extra = extra;
};

require('util').inherits(exports, Error);