"use strict"

var express = require('express')
var utils = require('../../misc/utils.js')

var db = require('../database/database.js')
var logger = require('../../log/logger.js')
var log = logger.getLogger()

var when = require('when')

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
  var moduleId = new db.mongo.ObjectID(req.params.expId)

  var del_redis_variation_promise = when.promise(function(resolve, reject) {
    db.redis.del(req.params.varId, function(err, result_cache) {
      if (err) {
        log.error("Error deleting keys of module in redis _id " + req.params.expId)
        resolve("Error deleting keys of module in redis _id " + req.params.expId)
      }
      resolve("Deleted keys of module in redis _id " + req.params.expId)
    })
  })

  var update_mongo_variations_promise = when.promise(function(resolve, reject) {
    db.mongo.variations.update(
      { 
      '_id' : varId //query
      },    
      { 
        $set: {
        'name' : req.body.name,
        'descr' : req.body.descr,
        'modified' : Date.now(),
        'html' : req.body.html,
        'css' : req.body.css,
        'js' : req.body.js
        }
      }, function(err, result) {
        if (err) {
          throw new Error("Not updated variation id " + req.params.varId)
        }
        resolve("Updated variations document id " + req.params.varId)
    })
  })

  var update_mongo_modules_promise = when.promise(function(resolve, reject) {
    db.mongo.modules.update(
      {
        '_id' : moduleId
      },
      {
        $unset : {
          'fit' : 1
        }
      },
      function(err, result) {
        if (err) {
          throw new Error("Mongo module id " + req.params.expId + " not removed fit object")
        }
        resolve("Deleted fit object from id " + req.params.expId)
      })
  })

  when.join(del_redis_variation_promise, update_mongo_variations_promise, update_mongo_modules_promise)
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
* DELETE 
* request to delete a certain variation.
* Deletes variation from variations collection
* Deletes all rows in data where variation was served
* Deletes variation id from modules.variations array
*/
exports.DELETE = function(req, res, next) {
  var varId = new db.mongo.ObjectID(req.params.varId)
  var moduleId = new db.mongo.ObjectID(req.params.expId)
  
  var del_mongo_variations_promise = when.promise(function(resolve, reject) {
    db.mongo.variations.remove({
      '_id' : varId
    }, function(err, result){
      if (err) {
        throw new Error("Variation not removed id " + req.params.varId)
      }
      resolve("Removed variation id " + req.params.varId)
    })
  })

  var update_mongo_data_promise = when.promise(function(resolve, reject) {
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
          throw new Error("Mongo data module id " + req.params.expId + " not removed var id " +req.params.varId)
        }
        resolve("Deleted where variation id " + req.params.varId + " module id " + req.params.expId)
      })
  })

  var update_mongo_modules_promise = when.promise(function(resolve, reject) {
    db.mongo.modules.update(
      {
        '_id' : moduleId
      },
      {
        $pull : {
          'variations' : varId
        },
        $unset : {
          'fit' : 1
        }
      },
      function(err, result) {
        if (err) {
          throw new Error("Mongo module id " + req.params.expId + ": not removed fit object and/or not removed array var id " +req.params.varId)
        }
        resolve("Deleted variation id " + req.params.varId + " and fit object from module id " + req.params.expId)
      })
    })

  when.join(del_mongo_variations_promise, update_mongo_data_promise, update_mongo_modules_promise)
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
* request init variations. Change database tables.
*/
exports.POST = function(req, res, next) {

  var userId = new db.mongo.ObjectID(req.params.userId)
  var moduleId = new db.mongo.ObjectID(req.params.expId)

  when.promise(function(resolve, reject) {  
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
          throw new Error("Not inserted new variation for module id " + req.params.expId)
        }
        log.info("Inserted into variations document id " + result.ops[0]._id)
        resolve(result.ops[0]._id)
      })
  }).then(function(new_id) {
    db.mongo.modules.update(
      {
        '_id' : moduleId
      },
      {
        $push : {
          'variations' : new_id
        }
      },
      function(err, result) {
        if (err) {
          log.error(err)
          res.status(400).json({})
        }
        log.info("Pushed new variation id to modules id " + req.params.expId)
        res.status(200).json({})
        /*
        Call to Re-Train model here in priority queue.
        */   
      }) 
  }).catch(function(err) {
    log.error(err)
    res.status(400).json({})
  })
}