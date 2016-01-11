exports.connect = function(callback){
	var mongo_client = require('mongodb').MongoClient
	var mongo_url
	if (process.env.DB_HOST === 'remote') {
		mongo_url = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PWD + '@' + process.env.MONGO_HOST + ':' + process.env.MONGO_PORT + '/' + process.env.MONGO_DB
	} else {
		mongo_url = 'mongodb://' + process.env.MONGO_HOST +  '/' + process.env.MONGO_DB
	}
	mongo_client.connect(mongo_url, function (err, db) {
		if (err) {
			callback(err);
		}
		var redisClient = require('redis').createClient;
		exports.mongo = db;
		exports.mongo.ObjectID = require('mongodb').ObjectID;
		exports.mongo.accounts = db.collection('accounts');
		exports.mongo.modules = db.collection('modules');
		exports.mongo.variations = db.collection('variations');
		exports.mongo.data = db.collection('data');
		exports.redis = redisClient(process.env.REDIS_PORT, process.env.REDIS_HOSTNAME, {no_ready_check: true});
		callback(err);
	});
};