var express = require('express');
//var sys = require('sys')
//var exec = require('child_process').exec;
var PythonShell = require('python-shell');

/* 
* API dir
*/
exports.GET = function(req, res, next) {
	var options = {
		mode: 'text',
		pythonPath: '/usr/bin/python2.7',
		pythonOptions: ['-u'],
		scriptPath: './../ai',
		args: [exp_uuid, '5', '26', 'job'] //latter 2 args are e.g. user account data from client's server
	};

	PythonShell.run('gradientBoosting.py', options, function (err, results) {
		if (err) {
			//LOGGER: console.log(JSON.stringify(err.traceback));
			res.json({"error":err.traceback});
		}
		res.json({"succes":results});
	});			
};


/*NOT USING PYTHON-SHELL
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
*/