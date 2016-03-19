var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    User = require('../models/user'),
    path = require('path');


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
    username: req.body.username, time: '00:00:00', finished: 'No'
  }), req.body.password, function(err, account) {
    if (err) {
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
        username: 'temp', time: '00:00:00', finished: 'No'
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

router.get('/logout', function(req, res, next) {

  User.findById(userId, function(err, user) {
    console.log(userId);
    if (err) {
      return res.status(500).json({err: err});
    }
    if (user) {
      if (user.finished === 'No') {
        user.time = time;
        user.finished = finished;
        user.distanceTraveled = distance;
        user.save();
        return res.status(200).json({'status': 'time updated!'});
      } else if (user.finished === 'Yes' && user.time > time && finished === 'Yes') {
        user.time = time;
        user.finished = finished;
        user.distanceTraveled = distance;
        user.save();
        return res.status(200).json({'status': 'time updated!'});
      } else {
        return res.status(200).json({'status': 'time NOT updated!'});
      }
    }

  });
  req.logout();
  res.status(200).json({status: 'Bye!'});
});

router.post('/update', function(req, res, next) {
  var userId = req.user._id,
      time = req.body.time,
      finished = req.body.finished,
      distance = req.body.distanceTraveled;

  User.findById(userId, function(err, user) {
    if (err) {
      return res.status(500).json({err: err});
    }
    if (user) {
      if (user.finished === 'No') {
        user.time = time;
        user.finished = finished;
        user.distanceTraveled = distance;
        user.save();
        return res.status(200).json({'status': 'time updated!'});
      } else if (user.finished === 'Yes' && user.time > time && finished === 'Yes') {
        user.time = time;
        user.finished = finished;
        user.distanceTraveled = distance;
        user.save();
        return res.status(200).json({'status': 'time updated!'});
      } else {
        return res.status(200).json({'status': 'time NOT updated!'});
      }
    }

  });


  // query database by user id
  // get highscore from database
  // update highscore if new score is greater than highscore from database

});

module.exports = router;
