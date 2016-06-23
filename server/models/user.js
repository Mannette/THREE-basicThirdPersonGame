// user model
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');


var User = new Schema({
  username: String,
  password: String,
  time: String,
  finished: String,
  distanceTraveled: String
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('users', User);
