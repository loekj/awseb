"use strict"

var express = require('express')

var db = require('../database/database.js')
var logger = require('../../log/logger.js')
var log = logger.getLogger()

/* 
* GET 
* request to fill-in the dom of the requested page. Read-only.
* will fetch all the experiments of this user_uuid
*/
exports.GET = function(req, res, next) {
	var userId = new db.mongo.ObjectID(req.params.userId)
	db.mongo.modules.find( { '_userId' : userId } ).toArray(function(err, result) {
		if (err) {
			log.error(err)
			res.status(400).json({})
		}
		res.status(200).json(result)
	})
}

