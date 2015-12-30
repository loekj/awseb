"use strict"

var express = require('express')
var uuid = require('uuid')
var math = require('math')
var promiseLib = require('when')

var utils = require('../../misc/utils.js')
//var except = require('../../misc/exceptions.js')

var db = require('../database/database.js')
var logger = require('../../log/logger.js')

//var connection = db.connect()
var log = logger.getLogger()

/* 
* GET 
* request to fill-in the dom of the requested page. Read-only.
*/
exports.GET = function(req, res, next) {
  var obj_id = new db.mongo.ObjectID(req.params.expId)
  db.mongo.modules.findOne({'_id' : obj_id}, function(err, result){
    if (err) {
      res.status(400).json({});
    }
    res.status(200).json(result);
  })
}


/* 
* DELETE 
* request to delete an experiment from experiment dashboard
*/
exports.DELETE = function(req, res, next) {
  var obj_id = new db.mongo.ObjectID(req.params.expId)
  db.mongo.modules.remove({'_id' : obj_id}, function(err, result){
    if (err) {
      res.status(400).json({});
    }
    log.info("Deleted modules document id " + req.params.expId)
    db.mongo.data.remove({'_moduleId' : obj_id}, function(err, result){
      if (err) {
        res.status(400).json({});
      }
      log.info("Deleted data document id of module id " + req.params.expId)
      res.status(200).json({});
    })    
  })
}


/* 
* PATCH
* request to alter experiment.
* if active key is defined it will only update active flag. 
* If not defined will update experiment
*/
exports.PATCH = function(req, res, next) {
  var obj_id = new db.mongo.ObjectID(req.params.expId)

  var succ_body, url = null
  if (utils.isDef(req.body.url)){
    url = req.body.url
  }

  if (!utils.isDef(req.body.succUuid.toLowerCase())) {
    succ_body = {
      '_id' : null,
      'fn' : req.body.succ.fn,
      'name' : req.body.succ.name,
      'url' : url,
      'args' : req.body.succ.args,
      'timeout' : req.body.timeout
    }
  } else {
    succ_body = {
      '_id' : req.body.succUuid,
      'url' : url,
      'args' : req.body.succ.args,
      'timeout' : req.body.timeout
    }
  } 
  db.mongo.modules.update(
    { 
    '_id' : obj_id //query
    },
    { 
      $setOnInsert : {
        '_id' : obj_id,
        '_userId' : req.params.userId,
        'name' : req.body.name,
        'descr' : req.body.descr,
        'modified' : Date.now(),
        'prop' : req.body.prop,
        'window' : req.body.dataWindow,
        'update' : req.body.updateModel,
        'succ' : succ_body
      }
    },
    {
      upsert : true
    },
    function (err, result) {
      if (err) {
        res.status(400).json({});
      }
      log.info("Updated modules document id " + req.params.expId)
      res.status(200).json({});
    }
  );  
}

/* 
* POST
* request to init experiment. Change database tables
*/
exports.POST = function(req, res, next) {

  var succ_body, url = null
  if (utils.isDef(req.body.succ.url)){
    url = req.body.succ.url
  }

  if (!utils.isDef(req.body.succ.succUuid.toLowerCase())) {
    succ_body = {
      'succUuid' : null,
      'fn' : req.body.succ.fn,
      'name' : req.body.succ.name,
      'url' : url,
      'args' : req.body.succ.args,
      'timeout' : parseInt(req.body.succ.timeout,10)
    }
  } else {
    succ_body = {
      'succUuid' : req.body.succ.succUuid,
      'url' : url,
      'args' : req.body.succ.args,
      'timeout' : parseInt(req.body.succ.timeout,10)
    }
  }

  var userId = new db.mongo.ObjectID(req.params.userId)
  db.mongo.modules.insert(
    {
      '_userId' : userId,
      'name' : req.body.name,
      'descr' : req.body.descr,
      'added' : Date.now(),
      'modified' : Date.now(),
      'prop' : parseInt(req.body.prop, 10),
      'window' : parseInt(req.body.dataWindow,10),
      'update' : parseInt(req.body.updateModel,10),
      'variations' : [],
      'succ' : succ_body,
      'featureType' : req.body.featureType
    }, function(err, result) {
      if (err) {
        log.error(err)
        res.status(400).json({})
      }
      log.info("Inserted into modules document id " + result.ops[0]._id)
      db.mongo.data.insert(
        {
          '_moduleId' : result.ops[0]._id,
          '_userId' : userId,
          'data' : []
        }, function(err, result) {
          if (err) {
            log.error(err)
            res.status(400).json({})
          }
          log.info("Inserted into data document id " + result.ops[0]._id)
          res.status(200).json({})
        })       
    })  
}