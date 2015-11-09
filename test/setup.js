function setupExperiments(connection, callback){
	var query = "CREATE TABLE IF NOT EXISTS experiments (" +
		"id INT NOT NULL AUTO_INCREMENT," +
		"addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"experimentUuid VARCHAR(255) NOT NULL," +
		"name VARCHAR(50) DEFAULT 'Untitled'," +
		"oauth VARCHAR(100) NOT NULL," +
		"succId INT NOT NULL," +
		"prop VARCHAR(255) NOT NULL," +
		"timeout INT NOT NULL DEFAULT 18000," +
		"PRIMARY KEY ( id )," +
		"UNIQUE KEY unique_experimentUuid ( experimentUuid )" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
	runQuery(query, connection, callback);	
}

function setupAccounts(connection, callback){
	var query = "CREATE TABLE IF NOT EXISTS accounts (" +
		"id INT NOT NULL AUTO_INCREMENT," +
		"addTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"modTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP," +
		"userUuid VARCHAR(255) NOT NULL," +
		"oauth VARCHAR(100) NOT NULL," +
		"permis VARCHAR(50) NOT NULL," +
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
		"succesfnUuid VARCHAR(255) NOT NULL," +
		"descr TINYBLOB NOT NULL," +
		"fn MEDIUMBLOB NOT NULL," +
		"argstr1 VARCHAR(50) DEFAULT NULL," +
		"argstr2 VARCHAR(50) DEFAULT NULL," +
		"argstr3 VARCHAR(50) DEFAULT NULL," +
		"argint1 INT DEFAULT NULL," +
		"argint2 INT DEFAULT NULL," +
		"argint3 INT DEFAULT NULL," +
		"PRIMARY KEY ( id )," +
		"UNIQUE KEY unique_succesfnUuid ( succesfnUuid )" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
	runQuery(query, connection, callback);
}



function runQuery(query, connection, callback) {
	console.log('Calling "' + query.slice(0,60) + '"...');
	connection.query(query, function(err, rows, fields) {
		if (err) {
			callback('error','error querying: ' + err.message);
		} else {
			callback(null, 'Rows affected: ' + rows.affectedRows);
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
	});
}