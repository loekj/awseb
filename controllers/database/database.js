
exports.connect = function(){
	var mode = process.env.NODE_ENV;
	var host = process.env.NODE_HOST;
	//log.info({NODE_ENV:mode, NODE_HOST:host}, 'env settings');

	var mysql = require('mysql');
	var connection = mysql.createConnection({
		host     : process.env.RDS_HOSTNAME,
		user     : process.env.RDS_USERNAME,
		password : process.env.RDS_PASSWORD,
		port     : process.env.RDS_PORT,
		database : process.env.RDS_DB_NAME
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