"use strict"

var express = require('express')
var utils = require('../../misc/utils.js')

var db = require('../database/database.js')
var logger = require('../../log/logger.js')
var log = logger.getLogger()

var when = require('when')

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
  console.log("CHECK1")
  var obj_id = new db.mongo.ObjectID(req.params.expId)
  db.mongo.modules.findOne({
    '_id' : obj_id
  }).then(function(result) {
    var variations = result.variations
    var del_redis_module_promise = when.promise(function(resolve, reject) {
      db.redis.del(req.params.expId, function(err, result_cache) {
        if (err) {
          log.error("Error deleting keys of module in redis _id " + req.params.expId)
          resolve("Error deleting keys of module in redis _id " + req.params.expId)
        }
        resolve("Deleted keys of module in redis _id " + req.params.expId)
      })
    })

    var del_mongo_variations_promise = when.promise(function(resolve, reject) {
      db.mongo.variations.remove({
        '_id' : {
          '$in' : variations
        }
      }, function(err, result) {
        if (err) {
          throw new Error("Not deleted mongo variations _id " + variations.join(', '))
        }
        resolve("Deleted variations " + variations.join(', ') + "; of modules id " + req.params.expId)
      })
    })

    var del_mongo_module_promise = when.promise(function(resolve, reject) {
      db.mongo.modules.remove({
        '_id' : obj_id
      }, function(err, result) {
        if (err) {
          throw new Error("Not deleted mongo module _id " + req.params.expId)
        }
        resolve("Deleted module id " + req.params.expId)
      })
    })

    var del_mongo_data_promise = when.promise(function(resolve, reject) {
      db.mongo.data.remove({
        '_moduleId' : obj_id
      }, function(err, result){
        if (err) {
          throw new Error("Mongo data collection unaffected for _moduleId " + req.params.expId)
        }
        resolve("Deleted data document id of module id " + req.params.expId)
      })    
    })
    
    when.join(del_redis_module_promise, del_mongo_variations_promise, del_mongo_module_promise, del_mongo_data_promise)
      .then(function(logs) {
        log.info(logs.join(', '))
        res.status(200).json({});
      }).catch(function(errors) {
        log.error(JSON.stringify(errors))
        res.status(400).json({});
      })

  })
}


/* 
* PATCH
* request to alter experiment.
*/
exports.PATCH = function(req, res, next) {
  var succ_uuid = null
  if (utils.isDef(req.body.succUuid.toLowerCase())) {
    succ_uuid = req.body.succUuid
  }
  var obj_id = new db.mongo.ObjectID(req.params.expId)
  
  var del_redis_module_promise = when.promise(function(resolve, reject) {
    db.redis.del(req.params.expId, function(err, result_cache) {
      if (err) {
        log.error("Error deleting keys of module in redis _id " + req.params.expId)
        resolve("Error deleting keys of module in redis _id " + req.params.expId)
      }
      resolve("Deleted keys of module in redis _id " + req.params.expId)
    })   
  })
  
  var update_mongo_module_promise = when.promise(function(resolve, reject) {
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
          'succUuid' : succ_uuid,
          'succ' : req.body.succ
        },
        $unset : {
          'fit' : 1
        }
      },
      {
        upsert : true
      },
      function (err, result) {
        if (err) {
          throw new Error("Not updated mongo module _id " + req.params.expId)
        }
        resolve("Updated modules document id " + req.params.expId)
      })
  })

  when.join(del_redis_module_promise, update_mongo_module_promise)
    .then(function(logs) {
      log.info(logs.join(', '))
      res.status(200).json({});
      /*
      Call to Re-Train model here in priority queue.
      */      
    }).catch(function(errors) {
      log.error(JSON.stringify(errors))
      res.status(400).json({});
    })
}


/* 
* POST
* request to init experiment. Change database tables
*/
exports.POST = function(req, res, next) {

  var succ_uuid = null
  if (utils.isDef(req.body.succUuid.toLowerCase())) {
    succ_uuid = req.body.succUuid
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
      'succUuid' : succ_uuid,
      'succ' : req.body.succ,
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