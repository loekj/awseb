"use strict";

var express = require('express');
var uuid = require('uuid');
var math = require('math');
var promiseLib = require('when');

var utils = require('../../misc/utils.js');
//var except = require('../../misc/exceptions.js');

var db = require('../database/database.js');
var logger = require('../../log/logger.js');

var connection = db.connect(true);
var log = logger.getLogger();

/* 
* GET
* Initial get request fill in the forms with entered values.
*/
exports.GET = function(req, res, next) {
  var variation_uuid = req.params.id;
  var exp_uuid = req.body.expUuid; // *Need extra from grady. if null, new experiment.

  console.log("variation_uuid: %s", variation_uuid);

  var args = {
    'variationUuid' : variation_uuid,
    'expUuid' : exp_uuid
  }
  var query_string = "SELECT name, active, CAST(html AS CHAR(10000) CHARACTER SET utf8) AS html, CAST(js AS CHAR(10000) CHARACTER SET utf8) AS js, CAST(css AS CHAR(10000) CHARACTER SET utf8) AS css FROM :expUuid_variations WHERE variationUuid = :variationUuid";
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
* POST
* request to alter or init variations of the experiment. Change database tables.
*/
exports.POST = function(req, res, next) {
  variation_uuid = req.params.id;

  var exp_name = req.body.name;
  var exp_uuid = req.body.expUuid; // *Need extra from grady. if null, new experiment.
  var user_uuid = req.body.userUuid; //*Need extra from grady
  var exp_descr = req.body.descr; //description of experiement *Need extra from grady
  var exp_prop = req.body.prop; 
  var succ_uuid = req.body.succUuid; //null if own succFn, otherwise its the default functions *Need extra from grady (need this on his site hardcoded)
  var succ = req.body.succ; //if default this is null, otherwise specified {fn, name, descr, arg1, arg2, arg3, arg4 **Need extra from grady}
  var exp_update = req.body.updateModel;
  var exp_window = req.body.dataWindow; 
  var exp_timeout = req.body.timeout; //When a test-subject timed out *Need extra from grady

  var promises_arr = [];
  var is_new_exp = false;
  
  // create expUuid
  if (exp_uuid.toLowerCase() === 'null') {
    var exp_uuid = utils.dashToUnder(uuid.v4());
    is_new_exp = true;
  }
  console.log("exp_uuid: %s", exp_uuid);
  // create succ_uuid if new successFn.
  if (succ_uuid.toLowerCase() === 'null') {
    var succ_uuid = utils.dashToUnder(uuid.v4());
    promises_arr.push(insertSuccFn(succ_uuid, user_uuid, succ));
  } else {
    // do nothing, just feed in succ_uuid in experiment table
  }

  if (is_new_exp) {
    // set up tables of exp and insert
    promises_arr.push(setupExpTables(exp_uuid));
    promises_arr.push(insertExp(exp_uuid, succ_uuid, exp_descr, exp_name, user_uuid, exp_prop, exp_timeout, exp_update, exp_window));
  } else {
    promises_arr.push(editExp(exp_uuid, succ_uuid, exp_descr, exp_name, user_uuid, exp_prop, exp_timeout, exp_update, exp_window));
  }

  promiseLib.all(promises_arr)
  .then(function() {
    res.status(200).json({});
  }, function (err) {
    log.error(err);
    res.status(400).json({});
  });
};


function insertExp(exp_uuid, succ_uuid, exp_descr, exp_name, user_uuid, exp_prop, exp_timeout, exp_update, exp_window) {
  return promiseLib.promise(function(resolve, reject) {   
    var args = {
      'expUuid' : exp_uuid,
      'succUuid' : succ_uuid,
      'descr' : exp_descr,
      'name' : exp_name,
      'userUuid' : user_uuid,
      'prop' : exp_prop,
      'timeout' : exp_timeout,
      'updateTime' : exp_update,
      'windowTime' : exp_window
    }
    var query_string = 'INSERT INTO experiments SET ?';
    connection.query(query_string, args, function(err, rows, fields) {
      if (err) {
        reject();//except.UnchangedError(err.message, 'Insert ' + exp_uuid + 'into experiments');
      }
    if (rows.affectedRows != '1') {
      reject();//except.UnchangedError("Rows affected: " + rows.affectedRows, 'Insert ' + exp_uuid + 'into experiments');
    }      
    log.info({'Rows affected' : rows.affectedRows}, 'Insert ' + exp_uuid + 'into experiments');
    resolve();
    });
  });
}

function editExp(exp_uuid, succ_uuid, exp_descr, exp_name, user_uuid, exp_prop, exp_timeout, exp_update, exp_window) {
  return promiseLib.promise(function(resolve, reject) {
    var args = {
      'succUuid' : user_uuid,
      'userUuid' : user_uuid,
      'prop' : exp_prop
    }    
    if (utils.isDef(exp_descr)) {
      args.descr = exp_descr;
    }
    if (utils.isDef(exp_name)) {
      args.name = exp_name;
    }    
    if (utils.isDef(exp_timeout)) {
      args.timeout = exp_timeout;
    }    
    if (utils.isDef(exp_update)) {
      args.updateTime = exp_update;
    } 
    if (utils.isDef(exp_window)) {
      args.windowTime = exp_window;
    }

    var query_string = "UPDATE experiments SET ? WHERE expUuid = 'a" + exp_uuid + "'";
    connection.query(query_string, args, function(err, rows, fields) {
      if (err) {
        reject();
      }
      if (rows.affectedRows != '1') {
        reject();
        //except.UnchangedError("Rows affected: " + rows.affectedRows, 'Insert ' + exp_uuid + 'into experiments');
      }        
      resolve();
    });
  });
}

function insertSuccFn(succ_uuid, user_uuid, succ) {
  return promiseLib.promise(function(resolve, reject) {   
    var args = {
      'succUuid' : succ_uuid,
      'userUuid' : user_uuid,
      'name' : succ.name,
      'descr' : succ.descr,
      'fn' : succ.fn,
      'argstr1' : succ.arg1,
      'argstr1' : succ.arg2,
      'argstr1' : succ.arg3,
      'argstr1' : succ.arg4
    }
    var query_string = 'INSERT INTO successfns SET ?';
    connection.query(query_string, args, function(err, rows, fields) {
      if (err) {
        reject();
      }
      if (rows.affectedRows != '1') {
        reject();//except.UnchangedError("Rows affected: " + rows.affectedRows, 'Insert ' + exp_uuid + 'into experiments');
      }              
      resolve();
    });
  });
}


function setupExpTables(exp_uuid) {
  return promiseLib.promise(function(resolve, reject) {   
    var sql1 = "CREATE TABLE IF NOT EXISTS " + exp_uuid + "_variations ( id INT NOT NULL AUTO_INCREMENT, addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, variationUuid VARCHAR(255) NOT NULL, name VARCHAR(50) NOT NULL DEFAULT 'Untitled', expUuid VARCHAR(255) NOT NULL, js MEDIUMBLOB, css MEDIUMBLOB, html MEDIUMBLOB, PRIMARY KEY ( id ), UNIQUE KEY unique_variationUuid ( variationUuid ) ) ENGINE=InnoDB DEFAULT CHARSET=utf8; "
    var sql2 = "CREATE TABLE IF NOT EXISTS " + exp_uuid + "_intest ( id INT NOT NULL AUTO_INCREMENT, addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, testUuid VARCHAR(255) NOT NULL, variationUuid VARCHAR(255) NOT NULL, expUuid VARCHAR(255) NOT NULL, miscFields MEDIUMBLOB DEFAULT NULL, PRIMARY KEY ( id ), UNIQUE KEY unique_testUuid ( testUuid ) ) ENGINE=InnoDB DEFAULT CHARSET=utf8; "
    var sql3 = "CREATE TABLE IF NOT EXISTS " + exp_uuid + "_userdata ( id INT NOT NULL AUTO_INCREMENT, addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, testUuid VARCHAR(255) NOT NULL, variationUuid VARCHAR(255) NOT NULL, expUuid VARCHAR(255) NOT NULL, successReturn VARCHAR(255) DEFAULT NULL, miscFields MEDIUMBLOB DEFAULT NULL, PRIMARY KEY ( id ), UNIQUE KEY unique_testUuid ( testUuid ) ) ENGINE=MyISAM DEFAULT CHARSET=utf8; "
    connection.query(sql1 + sql2 + sql3, function(err, rows, fields) {
      if (err) {
        reject();
      }      
    resolve();
    });
  });
}
