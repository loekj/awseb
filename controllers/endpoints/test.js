var express = require('express');
var net = require('net');
var fs = require('fs');
var socket_path = '/tmp/pysocket';
/* 
* POST
*/
exports.GET = function(req, res, next) {
	//check auth from cookie by running method on each request
	fs.stat(socket_path, function(err) {
		if (!err) {
			console.log('In !err, unlinking...');
			fs.unlinkSync(socket_path);
		}
		var unix_server = net.createServer(function(localSerialConnection) {
			localSerialConnection.on('data', function(data) {
				// data is a buffer from the socket
				console.log('logging data:');
				console.log(data);
				});
			// write to socket with localSerialConnection.write()
			localSerialConnection.write('Test message');
			});
		unixServer.listen(socket_path);
	});
};

