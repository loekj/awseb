var express = require('express');
//var sys = require('sys')
//var exec = require('child_process').exec;
var PythonShell = require('python-shell');

/* 
* API dir
*/
exports.POST = function(req, res, next) {
	req.query = req.body;
	var callb = req.query.callback;
	var user_uuid = req.query.userUuid;
	var modules_arr = req.query.modules;
	for(i=0; i < modules_arr.length; i++) {
		if (modules_arr[i].activeVariation.toLowerCase() == 'null') {
			var exper_uuid = modules_arr.experimentUuid;
			// person is not in test yet. Activate new test
			var options = {
				mode: 'text',
				pythonPath: '/usr/bin/python2.7',
				pythonOptions: ['-u'],
				scriptPath: '../ai/',
				args: ['value1', 'value2', 'value3']
			};

			PythonShell.run('gradientBoosting.py', options, function (err, results) {
				if (err) {
					throw err;
				}
				console.log('results: %j', results);
			});			
		} else {
			// person is already in test, feed already active variation in response!
		}
	}
	//header:

	//res.json({"name":"assss22ss"});
};


""" NOT USING PYTHON-SHELL
			var cpuUtilization = function (callback) {
				//exec('python -c "print(\\"AAAA\\")"', function (err, stdout, stderr) {
  				exec('python --version', function (err, stdout, stderr) {
	    			if (err) {
	    				return callback(err);
	    			}
	    			if (stdout) {
	    				callback(null, stdout);
	    			} else {
	    				callback(null, stderr);
	    			}
  				});
			};
			cpuUtilization(function (err, data) {
				if (data) {
					res.json({"nameDATA":data});
				} else {
					res.json({"nameERR":err});
				}
			});
"""