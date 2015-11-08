var express = require('express');
var router = express.Router();

fulfillment = require('./fulfilment.js');

/* Endpoint handling */
router.get('/fulfillment', function(req, res, next) {
  res.render('index', { title: 'ExpressA' });
});

/* Endpoint handling */
router.get('/fulfillmentB', function(req, res, next) {
  res.render('index', { title: 'ExpressB' });
});

module.exports = router;