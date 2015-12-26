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
* GET 
* request to fill-in the dom of the requested page. Read-only.
* will fetch all the experiments of this user_uuid
*/
exports.GET = function(req, res, next) {
  var args = {
    'userUuid' : req.params.userId
  }
  var query_string = "SELECT addTime, modTime, expUuid, succUuid, numVar, CAST(descr AS CHAR(10000) CHARACTER SET utf8) AS descr FROM experiments WHERE ?";
  connection.query(query_string, args, function(err, rows, fields) {
    if (err) {
      res.status(400).json({});
    }
    res.status(200).json({
      'experiments' : rows
    });
  });
};

