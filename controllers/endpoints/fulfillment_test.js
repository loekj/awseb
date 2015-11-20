var express = require('express');
var uuid = require('uuid');
var async = require("async");

//var sys = require('sys')
//var exec = require('child_process').exec;
var PythonShell = require('python-shell');
var db = require('../database/database.js');

DEFAULT_SUCCUUID = {
	'uuid1',
	'uuid2',
	'uuid3',
	'uuid4',
	'uuid5'
}

/* 
* API dir
*/
exports.GET = function(req, res, next) {
					
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