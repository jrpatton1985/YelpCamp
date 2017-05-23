var Campground = require("../models/campground"),
    Comment    = require("../models/comment"),
    User       = require("../models/user"),
    Rating     = require("../models/rating");

// =============== Middleware =================
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
  if (req.isAuthenticated()) {
      // Find and pass the campground to be editted
      Campground.findById(req.params.id, function(err, foundCampground) {
          if (err) {
            req.flash("error", "Campground not found.");
            res.redirect("back");
          } else {
            // does user own campground
            if (foundCampground.author.id.equals(req.user._id)) {
                // continue to intended form
                next();
            } else {
                // no permission to do that
                req.flash("error", "You do not have permission to do that.");
                res.redirect("back");
            }
          }
      });
  } else {
      // if not, redirect to previous page
      req.flash("error", "You need to be logged in to do that.");
      res.redirect("back");
  }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
  // is anyone logged in?
  if (req.isAuthenticated()) {
      // Find and pass the campground to be editted
      Comment.findById(req.params.comment_id, function(err, foundComment) {
          if (err) {
            res.redirect("back");
          } else {
            // does user own comment
            if (foundComment.author.id.equals(req.user._id)) {
                // continue to intended form
                next();
            } else {
                // no permission to do that
                req.flash("error", "You do not have permission to do that.");
                res.redirect("back");
            }
          }
      });
  } else {
      // if not, redirect to previous page
      req.flash("error", "You need to be logged in to do that.");
      res.redirect("back");
  }
}

middlewareObj.checkRatingExists = function(req, res, next) {
    Campground.findById(req.params.id).populate("ratings").exec(function(err, foundCampground) {
        if (err) {
            req.flash("error", err.message);
            res.redirect('back');
        }

        // find rating based on rater's id
        for (var i = 0; i < foundCampground.ratings.length; i++) {
            if (foundCampground.ratings[i].author.id.equals(req.user.id)) {
                req.flash('success', "You have already left a rating for this campground.");
                return res.redirect('/campgrounds/' + foundCampground._id);
            }
        }
        // if no rating found, continue
        next();
    });
}

middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // Set flash message
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/login");
}

middlewareObj.loginValidation = function(req, res, next) {
    // Sanitize login
    req.sanitize('username').trim();
    req.sanitize('password').trim();

    // Validation
    req.check('username', 'Username is required.').notEmpty();
    req.check('password', 'Password is required.').notEmpty();

    // Check for errors
    var errors = req.validationErrors();
    if (errors) {
        var msg = [];
        errors.forEach(function(error) {
            msg.push(error.msg);
        });
        req.flash("error", msg);
        res.redirect('back');
    } else {
      next();
    }
}

middlewareObj.registerValidation = function(req, res, next) {
  // Sanitize
  req.sanitize('password2').trim();
  // email
  req.check('email', 'An email address is required.').notEmpty();
  req.check('email', 'Please enter a valid email address.').isEmail();
  // Register Specific Validation
  req.check('password', 'Password needs to be at least 4 characters.').isLength({min: 4});
  req.check('password', 'Passwords do not match.').equals(req.body.password2);

  var errors = req.validationErrors();
  if (errors) {
      var msg = [];
      errors.forEach(function(error) {
          msg.push(error.msg);
      });
      req.flash("error", msg);
      // console.log(msg);
      res.redirect("back");
  } else {
    next();
  }
}

middlewareObj.changePasswordValidation = function(req, res, next) {
    // sanitize
    req.sanitize('password').trim();
    // validate
    req.check('password', 'Password is required.').notEmpty();
    req.check('password2', 'Confirm password is required.').notEmpty();
    req.check('password', 'Password needs to be at least 4 characters.').isLength({min: 4});
    req.check('password', 'Passwords do not match.').equals(req.body.password2);

    var errors = req.validationErrors();
    if (errors) {
      var msg = [];
      errors.forEach(function(error) {
        msg.push(error.msg);
      });
      req.flash('error', msg);
      res.redirect('back');
    } else {
      next();
    }
}

middlewareObj.findUniqueEmail = function(req, res, next) {
  User.findOne({email: req.body.email}, function(err, email) {
      if (email) {
        req.flash('error', 'An account with that email address already exists.');
        return res.redirect('/register');
      } else {
        next();
      }
  });
}
// ============================================

module.exports = middlewareObj;
