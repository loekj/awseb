exports.connect = function(){
	var mysql = require('mysql');
	var connection = mysql.createConnection({
		host     : process.env.RDS_HOSTNAME,
		user     : process.env.RDS_USERNAME,
		password : process.env.RDS_PASSWORD,
		port     : process.env.RDS_PORT,
		database : process.env.RDS_DB_NAME,
		multipleStatements : true
	});
	connection.on('close', function(err) {
		if (err) {
			connection = mysql.createConnection(connection.config);
		} else {
			console.log('Connection closed normally.');
		}
	});
	return connection;
};