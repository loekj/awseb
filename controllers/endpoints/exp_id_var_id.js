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
* Initial get request fill in the forms with entered values.
*/
exports.GET = function(req, res, next) {
  var variation_uuid = req.params.varId;
  var exp_uuid = req.params.expId;

  console.log("variation_uuid: %s", variation_uuid);
  console.log("exp_uuid: %s", exp_uuid);

  var args = {
    'variationUuid' : variation_uuid,
    'expUuid' : exp_uuid
  }
  var query_string = 'SELECT name, active, CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM ' + connection.escape(exp_uuid) + '_variations WHERE variationUuid = ' + connection.escape(variation_uuid);
  connection.query(query_string, args, function(err, rows, fields) {
    if (err) {
      res.status(400).json({});
    }
    if (rows.affectedRows != '1') {
      res.status(400).json({});//except.UnchangedError("Rows affected: " + rows.affectedRows, 'Insert ' + exp_uuid + 'into experiments');
    }              
    console.log(rows);
    res.status(200).json({
      'name' : rows.name,
      'active' : rows.active,
      'html' : rows.html,
      'js' : rows.js,
      'css' : rows.css
    });
  });
};


/* 
* PATCH
* request alter an existing variation or to disable/enable
*/
exports.PATCH = function(req, res, next) {
  var exp_uuid = req.params.expId;
  var variation_uuid = req.params.varId;

  var promises_arr = [];

  if (utils.isDef(req.body.active)) {
    promises_arr.push(updateActive(exp_uuid, variation_uuid, req.body.active));
  } else {
    var variation_name = req.body.name;
    var variation_html = req.body.html;
    var variation_js = req.body.js;
    var variation_css = req.body.css;    

    console.log("variation_uuid: %s", variation_uuid);
    promises_arr.push(editVariation(exp_uuid, variation_uuid, variation_name, variation_html, variation_js, variation_css));
  }

  promiseLib.all(promises_arr)
  .then(function() {
    res.status(200).json({});
  }, function (err) {
    log.error(err);
    res.status(400).json({});
  });  
}

/* 
* DELETE 
* request to delete a certain variation.
*/
exports.DELETE = function(req, res, next) {
  var exp_uuid = req.params.expId;
  var variation_uuid = req.params.varId;
  var promises_arr = [deleteVariation(exp_uuid, variation_uuid), updateNumVar(exp_uuid)];

  promiseLib.all(promises_arr)
  .then(function() {
    res.status(200).json({});
  }, function (err) {
    log.error(err);
    res.status(400).json({});
  });
}


/* 
* POST
* request init variations. Change database tables.
*/
exports.POST = function(req, res, next) {
  var exp_uuid = req.params.expId;

  var variation_name = req.body.name;
  var variation_html = req.body.html;
  var variation_js = req.body.js;
  var variation_css = req.body.css;
  
  var promises_arr = [];
  
  // create variation_uuid
  var variation_uuid = utils.dashToUnder(uuid.v4());

  promises_arr.push(insertVariation(exp_uuid, variation_uuid, variation_name, variation_html, variation_js, variation_css));
  promises_arr.push(updateNumVar(exp_uuid));

  promiseLib.all(promises_arr)
  .then(function() {
    res.status(200).json({});
  }, function (err) {
    log.error(err);
    res.status(400).json({});
  });
};



function updateNumVar(exp_uuid) {
  return promiseLib.promise(function(resolve, reject) {   
    var query_string = 'SELECT COUNT(*) AS rowsCount FROM ' + exp_uuid + '_variations';
    connection.query(query_string, args, function(err, rows, fields) {
      if (err) {
        reject();
      }
      if (!utils.isDef(rows[0].rowsCount)) {
        reject();
      }
      var args = {
        'numVar' : rows[0].rowsCount
      }
      var query_string = 'UPDATE experiments SET ?';
      connection.query(query_string, args, function(err, rows, fields) {
        if (err) {
          reject();
        }
        if (rows.affectedRows != '1') {
          reject();
        }      
        resolve();
      });
    });
  });
}


function deleteVariation(exp_uuid, variation_uuid) {
  return promiseLib.promise(function(resolve, reject) {   
    var args = {
      'variationUuid' : variation_uuid,
    }
    var query_string = 'DELETE FROM ' + exp_uuid + '_variations, WHERE ?';
    connection.query(query_string, args, function(err, rows, fields) {
      if (err) {
        reject();
      }
    if (rows.affectedRows != '1') {
      reject();
    }      
    log.info({'Rows affected' : rows.affectedRows}, 'Insert ' + variation_uuid + 'into ' + exp_uuid + '_variations');
    resolve();
    });
  });
}


function insertVariation(exp_uuid, variation_uuid, variation_name, variation_html, variation_js, variation_css) {
  return promiseLib.promise(function(resolve, reject) {   
    var args = {
      'variationUuid' : variation_uuid,
      'name' : variation_name,
      'html' : variation_html,
      'js' : variation_js,
      'css' : variation_css
    }
    var query_string = 'INSERT INTO ' + exp_uuid + '_variations SET ?';
    connection.query(query_string, args, function(err, rows, fields) {
      if (err) {
        reject();
      }
    if (rows.affectedRows != '1') {
      reject();
    }      
    log.info({'Rows affected' : rows.affectedRows}, 'Insert ' + variation_uuid + 'into ' + exp_uuid + '_variations');
    resolve();
    });
  });
}

function editVariation(exp_uuid, variation_uuid, variation_name, variation_html, variation_js, variation_css) {
  return promiseLib.promise(function(resolve, reject) {
    var args = {} 
    if (utils.isDef(variation_name)) {
      args.name = variation_name;
    }
    if (utils.isDef(variation_html)) {
      args.html = variation_html;
    }    
    if (utils.isDef(variation_js)) {
      args.js = variation_js;
    }        
    if (utils.isDef(variation_css)) {
      args.css = variation_css;
    }        

    var query_string = 'UPDATE ' + exp_uuid + '_variations SET ? WHERE variationUuid = ' + connection.escape(variation_uuid);
    connection.query(query_string, args, function(err, rows, fields) {
      if (err) {
        reject();
      }
      if (rows.affectedRows != '1') {
        reject();
      }        
      resolve();
    });
  });
}


