"use strict";

var express = require('express');
var uuid = require('uuid');
var math = require('math');
var promiseLib = require('when');

var utils = require('../../misc/utils.js');
//var except = require('../../misc/exceptions.js');

var db = require('../database/database.js');
var logger = require('../../log/logger.js');

var connection = db.connect();
var log = logger.getLogger();

/* 
* POST
*/
exports.POST = function(req, res, next) {
	var first_name = req.body.firstName;
	var last_name = req.body.lastName;
	var oauth = req.body.oauth;

	// for now just permis 1? whatever that would mean later
	var permis = '1';
	var user_uuid = utils.dashToUnder(uuid.v4());

	var args = {
		'userUuid' : user_uuid,
		'firstName' : first_name,
		'lastName' : last_name,
		'oauth' : oauth,
		'permis' : permis
	}
	var query_string = 'INSERT INTO accounts SET ?';
	connection.query(query_string, args, function(err, rows, fields) {
		if (err || !utils.isDef(rows) || rows.affectedRows != '1') {
			res.status(400).json({});
		} else {
			res.status(200).json({});
		}
	});  
};

