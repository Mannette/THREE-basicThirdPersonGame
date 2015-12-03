var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    User = require('../models/user'),
    nonUser = require('../models/nonUser');


router.get('/', function(req, res, next) {
  res.render('layout');
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return res.status(404).json({err: info});
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({err: 'Could not log in user'});
      }
      res.status(200).json({status: 'Login successful!'});
    });
  })(req, res, next);
});

router.post('/register', function(req, res, next) {
  User.register(new User({
    username: req.body.username
  }), req.body.password, function(err, account) {
    if (err) {
      return res.status(500).json({err: err});
    }
    passport.authenticate('local')(req, res, function() {
      return res.status(200).json({status: 'Registration successful!'});
    });
  });
});

router.post('/tempUser', function(req, res, next) {
  nonUser.register(new tempUser({}), function(err, account) {
    if (err) {
      return res.status(500).json({err: err});
    }
    return res.status(200).json({status: 'Time to play!'});
  });
});

router.get('/#/game', function(req, res, next) {
  res.render('myDemo');
});

module.exports = router;
