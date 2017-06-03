var mongoose              = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose"),
    bcrypt                = require("bcrypt-nodejs");
    crypto                = require("crypto");

var UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    image: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type: Boolean, default: false}
});

UserSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
      if (err) {
        req.flash("error", err.message);
        res.redirect('back');
      }
      bcrypt.hash(user.password, salt, null, function(err, hash) {
        if (err) {
          req.flash("error", err.message);
          res.redirect('back');
        }
        user.password = hash;
        next();
      });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);
