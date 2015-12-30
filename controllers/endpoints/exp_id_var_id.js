"use strict";

var express = require('express');
var uuid = require('uuid');
var math = require('math');
var promiseLib = require('when');

var utils = require('../../misc/utils.js');
//var except = require('../../misc/exceptions.js');

var db = require('../database/database.js');
var logger = require('../../log/logger.js');

//var connection = db.connect();
var log = logger.getLogger();

/* 
* GET
* Initial get request fill in the forms with entered values.
*/
exports.GET = function(req, res, next) {

};


/* 
* PATCH
* request alter an existing variation or to disable/enable
*/
exports.PATCH = function(req, res, next) {
   
}

/* 
* DELETE 
* request to delete a certain variation.
*/
exports.DELETE = function(req, res, next) {
 
}


/* 
* POST
* request init variations. Change database tables.
*/
exports.POST = function(req, res, next) {

  var userId = new db.mongo.ObjectID(req.params.userId)
  var moduleId = new db.mongo.ObjectID(req.params.expId)
  db.mongo.variations.insert(
    {
      '_moduleId' : moduleId,
      '_userId' : userId,
      'name' : req.body.name,
      'descr' : req.body.descr,
      'added' : Date.now(),
      'modified' : Date.now(),
      'html' : req.body.html,
      'css' : req.body.css,
      'js' : req.body.js
    }, function(err, result) {
      if (err) {
        log.error(err)
        res.status(400).json({})
      }
      log.info("Inserted into variations document id " + result.ops[0]._id)
      db.mongo.modules.update(
        {
          '_id' : moduleId
        },
        {
          $push : {
            'variations' : result.ops[0]._id
          }
        },
        function(err, result) {
          if (err) {
            log.error(err)
            res.status(400).json({})
          }
          log.info("Updated (pushed variation id) modules document id " + req.params.expId)
          res.status(200).json({})
        }) 
    })
}