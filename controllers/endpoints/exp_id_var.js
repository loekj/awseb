"use strict";

var express = require('express');

var db = require('../database/database.js');
var logger = require('../../log/logger.js');
var log = logger.getLogger();

/* 
* GET 
* request to fill-in the dom of the requested page. Read-only.
*/
exports.GET = function(req, res, next) {
	var obj_id = new db.mongo.ObjectID(req.params.expId)
	db.mongo.modules.findOne({'_id' : obj_id}, function(err, result){
		if (err) {
			res.status(400).json({})
		}
		var obj_arr = result.variations.map(function(val) { //synchronous
			return new db.mongo.ObjectID(val)
		})
		db.mongo.variations.find({
			'_id' : {
				$in : obj_arr
			}
		}).toArray(function ( err, result) {
			res.status(200).json(result)
		})
	})
}