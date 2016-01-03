function setupExperiments(connection, callback){
	var query = "CREATE TABLE IF NOT EXISTS experiments (" +
		"id INT NOT NULL AUTO_INCREMENT," +
		"addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"expUuid VARCHAR(255) NOT NULL," +
		"succUuid VARCHAR(255) NOT NULL," +
		"numVar INT DEFAULT 0," + //Number of variations, set in different window
		"descr BLOB NOT NULL," +
		"name VARCHAR(50) DEFAULT 'Untitled'," +
		"userUuid VARCHAR(255) NOT NULL," +
		"prop INT NOT NULL," +
		"timeout INT NOT NULL DEFAULT 18000," +
		"updateTime INT NOT NULL DEFAULT 30," + //30 days, 0 value is after each new point
		"windowTime INT NOT NULL DEFAULT 1," + //1 day
		"active BOOLEAN NOT NULL DEFAULT 0," +
		"PRIMARY KEY ( id )," +
		"UNIQUE KEY unique_expUuid ( expUuid )" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
	runQuery(query, connection, callback);
}

function setupAccounts(connection, callback){
	var query = "CREATE TABLE IF NOT EXISTS accounts (" +
		"id INT NOT NULL AUTO_INCREMENT," +
		"addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"userUuid VARCHAR(255) NOT NULL," +
		"firstName VARCHAR(255) NOT NULL," +
		"lastName VARCHAR(255) NOT NULL," +
		"oauth VARCHAR(100) NOT NULL," +
		"permis VARCHAR(50) NOT NULL DEFAULT 1," +
		"subscrId INT NOT NULL DEFAULT 0," +
		"PRIMARY KEY ( id )," +
		"UNIQUE KEY unique_oauth ( oauth )," +
		"UNIQUE KEY unique_userUuid ( userUuid )" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
	runQuery(query, connection, callback);
}

function setupSuccess(connection, callback){
	var query = "CREATE TABLE IF NOT EXISTS successfns (" +
		"id INT NOT NULL AUTO_INCREMENT," +
		"addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"succUuid VARCHAR(255) NOT NULL," +
		"userUuid VARCHAR(255) DEFAULT NULL," +
		"name VARCHAR(50) DEFAULT 'Untitled'," +
		"descr BLOB NOT NULL," +
		"fn BLOB NOT NULL," +
		"argstr1 VARCHAR(100) DEFAULT NULL," +
		"argstr2 VARCHAR(100) DEFAULT NULL," +
		"argstr3 VARCHAR(100) DEFAULT NULL," +
		"argstr4 VARCHAR(100) DEFAULT NULL," +
		"PRIMARY KEY ( id )," +
		"UNIQUE KEY unique_succUuid ( succUuid )" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
	runQuery(query, connection, callback);
}



function runQuery(query, connection, callback) {
	console.log('Calling "' + query.slice(0,60) + '"...');
	connection.query(query, function(err, rows) {
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
	    		setupAccounts(connection, callback);
	    	},	    	
	    	function(callback) {
	    		setupExperiments(connection, callback);
	    	},
			function(callback) {
	    		setupSuccess(connection, callback);
	    	}
	], function (err, results) {

	    console.log(results);
	    process.exit(0);
		// var args = {
		// 	'userUuid' : "cdc7b5e9_1556_4539_b62c_65b0c81510f3",
		// 	'firstName' : "Loek",
		// 	'lastName' : "Janssen",
		// 	'oauth' : "ljanssen@stanford.edu",
		// 	'permis' : "1"
		// }
		// var query_string = 'INSERT INTO accounts SET ?';
		// connection.query(query_string, args, function(err, rows, fields) {
		// 	if (err) {
		// 		throw Error(err.message);
		// 	}
		// 	if (rows.affectedRows != '1') {
		// 		throw Error("No affected rows..?");
		// 	}
		// 	process.exit(0);
		// });
	});
}