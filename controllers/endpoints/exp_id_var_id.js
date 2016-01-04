"use strict"

var express = require('express')
var utils = require('../../misc/utils.js')

var db = require('../database/database.js')
var logger = require('../../log/logger.js')
var log = logger.getLogger()

/* 
* GET
* Initial get request fill in the forms with entered values.
*/
exports.GET = function(req, res, next) {
  var varId = new db.mongo.ObjectID(req.params.varId)
  db.mongo.variations.findOne({'_id' : varId}, function(err, result){
    if (err) {
      res.status(400).json({})
    }
    res.status(200).json(result)
  })
}

/* 
* PATCH
* request alter an existing variation or to disable/enable
*/
exports.PATCH = function(req, res, next) {
  var varId = new db.mongo.ObjectID(req.params.varId)

  db.mongo.variations.update(
    { 
    '_id' : varId //query
    },    
    { $set: {
      'name' : req.body.name,
      'descr' : req.body.descr,
      'modified' : Date.now(),
      'html' : req.body.html,
      'css' : req.body.css,
      'js' : req.body.js
      }
    }, function(err, result) {
      if (err) {
        log.error(err)
        res.status(400).json({})
      }
      log.info("Updated variations document id " + req.params.varId)
      res.status(200).json({})
    })   
}

/* 
* DELETE 
* request to delete a certain variation.
* Deletes variation from variations collection
* Deletes all rows in data where variation was served
* Deletes variation id from modules.variations array
*/
exports.DELETE = function(req, res, next) {
  var varId = new db.mongo.ObjectID(req.params.varId)
  var moduleId = new db.mongo.ObjectID(req.params.expId)
  db.mongo.variations.remove({'_id' : varId}, function(err, result){
    if (err) {
      log.error(err)
      res.status(400).json({});
    }
    log.info("Deleted variaton document id " + req.params.varId)
    db.mongo.data.update(
      {
        '_moduleId' : moduleId
      },
      {
        $pull : {
          'data' : {
            'variation' : varId
          }
        }
      },
      function(err, result){
        if (err) {
          log.error(err)
          res.status(400).json({});
        }
        log.info("Deleted rows where variation = " + req.params.varId + " in data document moduleId " + req.params.expId)
        db.mongo.modules.update(
          {
            '_id' : moduleId
          },
          {
            $pull : {
              'variations' : varId
            }
          },
          function(err, result) {
            if (err) {
              log.error(err)
              res.status(400).json({});
            }
            log.info("Deleted variation " + req.params.varId + " from module.variation array of moduleId " + req.params.expId)            
            res.status(200).json({});
            
            /*
            Try to Re-Train model here, if conditions (min. num served etc..) not met, 
            Remove the 'fit' key from module document
            */
          }
        )
      }
    )
  })    
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