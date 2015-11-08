var express = require('express');
var router = express.Router();

/* 
* GET
*/
router.get('/fulfillment', function(req, res, next) {
	console.log("GOOEEEE");
	res.send(req);
  res.render('index', { title: 'ExpressFULFILLMENT' });
});

module.exports = router;
