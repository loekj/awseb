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
	var obj_id = new db.mongo.ObjectID(req.params.expId)
	db.mongo.modules.findOne({'_id' : obj_id}, unction(err, result){
		if (err) {
			res.status(400).json({})
		}
		var obj_arr = result.variations.map(function(val) { //synchronous
			return new db.mongo.ObjectID(val)
		})
		res.status(200).json(
			fb.mongo.variations.find({
				'id' : {
					$in : obj_arr
				}
			}).toArray()
		)
	})
}