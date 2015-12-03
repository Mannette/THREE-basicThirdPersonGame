// user model
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');


var tempUser = new Schema({
  highscore: Number
});

module.exports = mongoose.model('temp', tempUser);
