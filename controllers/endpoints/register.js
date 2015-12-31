"use strict";

var express = require('express');
var uuid = require('uuid');
var math = require('math');
var promiseLib = require('when');
var crypto = require('crypto');

var utils = require('../../misc/utils.js');
//var except = require('../../misc/exceptions.js');

var db = require('../database/database.js');
var logger = require('../../log/logger.js');

//var connection = db.connect();
var log = logger.getLogger();

/* 
* POST
*/
exports.POST = function(req, res, next) {
	var salt = crypto.randomBytes(128).toString('base64');
	crypto.pbkdf2(req.body.pwd, salt, 10000, 512, function(err, derived_key) {
		var pwd_crypt = derived_key;
		db.mongo.accounts.update(
			{ 
			'email' : req.body.email //query
			},
			{	
				$setOnInsert : {
					'email' : req.body.email, 'pwd' : pwd_crypt, 'salt' : salt, 'firstName' : req.body.firstName, 'lastName' : req.body.lastName, 'added' : Date.now(), 'permis' : 1, 'subscrId' : 0
				}
			},
			{
				upsert : true
			},
			function (err, result) {
				if (err) {
					res.status(400).json({});
				}
				res.status(200).json({});
			}
		);
  	});
}	