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
			var exp_uuid = modules_arr.experimentUuid;
			// person is not in test yet. Activate new test
			var options = {
				mode: 'text',
				pythonPath: '/usr/bin/python2.7',
				pythonOptions: ['-u'],
				scriptPath: '/Users/loekjanssen/Sigmatic/node-express/controllers/ai',
				args: [exp_uuid, '5', '26', 'job'] //latter 2 args are e.g. user account data from client's server
			};

			PythonShell.run('gradientBoosting.py', options, function (err, results) {
				if (err) {
					//LOGGER: console.log(JSON.stringify(err.traceback));
					res.json({"error":err.traceback});
				}
				res.json({"succes":results});
			});			
		} else {
			// person is already in test, feed already active variation in response!
		}
	}
	//header:

	//res.json({"name":"assss22ss"});
};
