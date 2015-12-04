var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    User = require('../models/user'),
    path = require('path'),
    nonUser = require('../models/nonUser');


router.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
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
    username: req.body.username, highscore: 0
  }), req.body.password, function(err, account) {
    if (err) {
      console.log(err);
      return res.status(500).json({err: err});
    }
    passport.authenticate('local', function(error, user, info) {
      if (error) { return next(error); }
      if (!user) {
        return res.status(404).json({error: info});
      }
      req.logIn(user, function(errors) {
        if (errors) {
          return res.status(500).json({errors: 'Could not log in user'});
        }
        return res.status(200).json({status: 'Registration successful!'});
      });
      // return res.status(200).json({status: 'Registration successful!'});
    })(req, res, next);
  });
});

router.post('/tempUser', function(req, res, next) {
  User.findOne({username:'temp'}, function(err, user) {
    if (err) {
      return res.status(500).json({err: err});
    }
    if (user) {
      return res.status(200).json({status: 'Temp registration successful!'});
    } else {
      User.register(new User({
        username: 'temp', highscore: 0
      }), 'temp', function(error, account) {
        if (error) {
          return res.status(500).json({err: err});
        }
        passport.authenticate('local', function(errors, response, info) {
          return res.status(200).json({status: 'Temp registration successful!'});
        });
      });
    }
  });
});

// router.get('/game', function(req, res, next) {
//   res.render('myDemo');
// });

module.exports = router;
