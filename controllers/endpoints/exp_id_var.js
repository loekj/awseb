"use strict";

var express = require('express');
var uuid = require('uuid');
var promiseLib = require('when');

var utils = require('../../misc/utils.js');
//var except = require('../../misc/exceptions.js');

var db = require('../database/database.js');
var logger = require('../../log/logger.js');

//var connection = db.connect();
var log = logger.getLogger();

/* 
* GET 
* request to fill-in the dom of the requested page. Read-only.
*/
exports.GET = function(req, res, next) {
	var exp_uuid = req.params.expId;
	var args = {
		'expUuid' : exp_uuid
	}
	var query_string = "SELECT addTime, modTime, variationUuid, name, active, CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM " + exp_uuid + "_variations";
	connection.query(query_string, args, function(err, rows, fields) {
		if (err) {
			res.status(400).json({});
		} 
		if (!rows[0]) {
			res.status(200).json(
				{}
			);			
		}             
		res.status(200).json(
			rows[0]
		);
	});
}