exports.connect = function(callback){
	var mongo_client = require('mongodb').MongoClient;
	//mongo_client.connect('mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PWD + '@' + process.env.MONGO_HOST + process.env.MONGO_PORT + '/' + process.env.MONGO_DB, function (err, db) {
		mongo_client.connect('mongodb://' + process.env.MONGO_HOST +  '/' + process.env.MONGO_DB, function (err, db) {
		if (err) {
			callback(err);
		}
		var redisClient = require('redis').createClient;
		exports.mongo = db;
		exports.mongo.accounts = db.collection('accounts');
		exports.mongo.modules = db.collection('modules');
		exports.mongo.variations = db.collection('variations');
		exports.redis = redisClient(process.env.REDIS_PORT, process.env.REDIS_HOSTNAME, {no_ready_check: true});
		callback(err);
	});
};