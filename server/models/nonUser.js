// user model
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');


var tempUser = new Schema({
  username: String,
  highscore: Number
});

module.exports = mongoose.model('tempUsers', tempUser);
