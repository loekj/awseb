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
			callback(err, err.message);
		} else {
			callback(null, JSON.stringify(rows));
		}
	});
}

if (require.main === module) {
	var async = require('async');
	var mysql = require('mysql');

	var connection = mysql.createConnection({
		host     : process.env.RDS_HOSTNAME,
		user     : process.env.RDS_USERNAME,
		password : process.env.RDS_PASSWORD,
		port     : process.env.RDS_PORT,
		database : process.env.RDS_DB_NAME,
		multipleStatements : true
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