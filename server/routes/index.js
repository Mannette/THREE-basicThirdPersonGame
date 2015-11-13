var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('layout');
});

router.get('/game', function(req, res, next) {
  res.render('myDemo');
});

module.exports = router;
