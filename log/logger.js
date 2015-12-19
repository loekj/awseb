var logger = require('bunyan');

exports.getLogger = function() {
	return logger.createLogger({
		name: 'sigmatic',
		streams:
			[
				{
					level: 'info',
					stream: process.stdout
					//path: __dirname + '/sigmatic-info.log'
				},
				{
					level: 'warn',
					path: __dirname + '/sigmatic-error.log'  // log WARN and above
				}
			]
		});
}