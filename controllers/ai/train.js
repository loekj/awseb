"use strict"

var express = require('express')
var uuid = require('uuid')
var async = require('async')
var math = require('math')
var promiseLib = require('when')

var utils = require('../../misc/utils.js')
var db = require('../database/database.js')
var logger = require('../../log/logger.js')

var log = logger.getLogger()

exports.trainNB = function(exp_uuid) {
	//db.mongo.modules.find.....
}