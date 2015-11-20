// var express = require('express');

// /* 
// * POST
// */
// exports.POST = function(req, res, next) {
// 	var newexp_json = req.body;

// 	// If custom success, edit succes fn table:
// 	if (newexp_json.succesFnDdefault) {
//     var succesUuid = newexp_json.succesFnDefault;
// 	} else { 
// 	// custom must be defined
// 	// create new uuid
// 	// call database controller and do query asynchronous,
// 	var query = ... minify(newexp_json.succesFnBlob);
// 	var succesUuid = 
// 	}  

// 	// Assuming all keys exist as contract prescribed in sigmatic docs
// 	var new_exp = {
// 	name = newexp_json.expName;
// 	prop = newexp_json.expProp;
// 	...
// 	...
// 	...
// 	}
// 	var exp_uuid = ....
// 	// do INSERT query here

// 	// send json back with header defined
// 	res.json({"hallo":"halloo"});	
// };



  // function setupVariations(connection, callback){
  //   var ful_query = req.body;
  //   var tests_arr = ful_query.data.tests;
  //   var query = "CREATE TABLE IF NOT EXISTS " + experiment_uuid + ".variations (" +
  //     "id INT NOT NULL AUTO_INCREMENT," +
  //     "addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
  //     "modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
  //     "variationUuid VARCHAR(255) NOT NULL," +
  //     "name VARCHAR(50) NOT NULL DEFAULT 'Untitled'," +
  //     "experimentUuid VARCHAR(255) NOT NULL," +
  //     "js MEDIUMBLOB NOT NULL," +
  //     "css MEDIUMBLOB NOT NULL," +
  //     "html MEDIUMBLOB NOT NULL" +
  //     "PRIMARY KEY ( id )," +
  //     "UNIQUE KEY unique_variationUuid ( variationUuid )" +
  //     ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
  //   runQuery(query, connection, callback);
  // }


  // function setupInTest(connection, callback){
  //   var query = "CREATE TABLE IF NOT EXISTS " + experiment_uuid + ".intest (" +
  //   "id INT NOT NULL AUTO_INCREMENT," +
  //   "addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
  //   "testUuid VARCHAR(255) NOT NULL," +  
  //   "userUuid VARCHAR(255) NOT NULL," +
  //   "variationUuid VARCHAR(255) NOT NULL," +
  //   "experimentUuid VARCHAR(255) NOT NULL" +
  //   "PRIMARY KEY ( id )," +
  //   "UNIQUE KEY unique_testUuid ( testUuid )" +
  //   ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
  //   runQuery(query, connection, callback);
  // }


  // function setupUserData(connection, callback){
  //   var query = "CREATE TABLE IF NOT EXISTS " + experiment_uuid + ".userdata (" +
  //   "id INT NOT NULL AUTO_INCREMENT," +
  //   "addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
  //   "testUuid VARCHAR(255) NOT NULL," +
  //   "userUuid VARCHAR(255) NOT NULL," +
  //   "variationUuid VARCHAR(255) NOT NULL," +
  //   "expUuid VARCHAR(255) NOT NULL," +
  //   "succesReturn VARCHAR(255) DEFAULT NULL," +
  //   "miscFields MEDIUMBLOB DEFAULT NULL" +
  //   "PRIMARY KEY ( id )," +
  //   "UNIQUE KEY unique_testUuid ( testUuid )" +
  //   ") ENGINE=MyISAM DEFAULT CHARSET=utf8;";
  //   runQuery(query, connection, callback);
  // }
