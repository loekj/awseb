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
  var exp_uuid = req.params.expId;

  console.log("exp_uuid: %s", exp_uuid);

  var args = {
    'expUuid' : exp_uuid
  }
  var query_string = "SELECT numVar, descr, name, prop, timeout, updateTime, windowTime, active FROM experiments WHERE expUuid = :expUuid";
  connection.query(query_string, args, function(err, rows, fields) {
    if (err) {
      res.status(400).json({});
    }
    if (rows.affectedRows != '1') {
      res.status(400).json({});//except.UnchangedError("Rows affected: " + rows.affectedRows, 'Insert ' + exp_uuid + 'into experiments');
    }              
    console.log(rows);
    res.status(200).json({
      'numVar' : rows.numVar,
      'descr' : rows.descr,
      'name' : rows.name,
      'prop' : rows.prop,
      'active' : rows.active,
      'timeout' : rows.timeout,
      'updateTime' : rows.updateTime,
      'windowTime' : rows.windowTime,
      'active' : rows.active
    });
  });
};

