function teardownDatabase(connection, callback){
	var query = "DROP DATABASE ebdb;";
	runQuery(query, connection, callback);
}

function resetDatabase(connection, callback){
	var query = "CREATE DATABASE ebdb;";
	runQuery(query, connection, callback);
}

function runQuery(query, connection, callback) {
	console.log('Calling "' + query.slice(0,60) + '"...');
	connection.query(query, function(err, rows, fields) {
		if (err) {
			callback('error','error querying: ' + err.message);
		} else {
			callback(null, 'Affected: ' + rows.affectedRows);
		}
	});
}

if (require.main === module) {
	var async = require('async');
	var mysql = require('mysql');

	db_user = process.argv[2];
	db_pwd = process.argv[3];
	
	var connection = mysql.createConnection({
	  host     : "aavktpb0yx3vyf.ck7xy5rlukt9.us-west-2.rds.amazonaws.com",
	  user     : db_user,
	  password : db_pwd,
	  port     : "3306",
	  database : "ebdb"
	});

	async.series([
	    	function(callback) {
	    		teardownDatabase(connection, callback);
	    	},	    	
	    	function(callback) {
	    		resetDatabase(connection, callback);
	    	}
	], function (err, results) {
	    console.log(results);
	    process.exit(0);
	});
}