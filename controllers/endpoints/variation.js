"use strict";

var express = require('express');
var uuid = require('uuid');
var promiseLib = require('when');

var utils = require('../../misc/utils.js');
//var except = require('../../misc/exceptions.js');

var db = require('../database/database.js');
var logger = require('../../log/logger.js');

var connection = db.connect(true);
var log = logger.getLogger();

/* 
* GET 
* request to fill-in the dom of the requested page. Read-only.
*/
exports.GET = function(req, res, next) {
  res.status(200).json({});
}

/* 
* POST
* request to disable/enable a certain variation.
*/
exports.POST = function(req, res, next) {
  var variation_uuid = req.body.variation_uuid; 
  res.status(200).json({'switch on/off' : variation_uuid});
}

/* 
* DELETE 
* request to delete a certain variation.
*/
exports.DELETE = function(req, res, next) {
  var variation_uuid = req.body.variation_uuid; 
  res.status(200).json({'deleting' : variation_uuid});
}
