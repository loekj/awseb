var express = require('express');

/* 
* POST
*/
exports.POST = function(req, res, next) {
	var callb = req.query.callback;
	var user_uuid = req.query.userUuid;
	var modules_arr = req.query.modules;
	for(i=0; i < modules_arr.length; i++) {
		console.log(i);
		if (modules_arr[i].activeVariation.toLowerCase() == 'null') {
			var exper_uuid = modules_arr.experimentUuid;
			// person is not in test yet. Activate new test
			var cpuUtilization = function (callback) {
				//exec('./nodeprime/cpuUtilization.py', function (err, stdout, stderr) {
  				exec('python --version', function (err, stdout, stderr) {
    			if (err) {
    				return callback(err);
    			}
    			callback(null, JSON.parse(stdout));
  				});
			};
			cpuUtilization(function (err, data) {
				log.console(data);
			});
			break;
		} else {
			// person is already in test, feed already active variation in response!
			break;
		}
	}
};

