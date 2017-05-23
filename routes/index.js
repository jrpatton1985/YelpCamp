var express      = require("express"),
    router       = express.Router(),
    passport     = require("passport"),
    async        = require("async"),
    crypto       = require('crypto'),
    nodemailer   = require("nodemailer"),
    sgTransport  = require('nodemailer-sendgrid-transport'),
    User         = require("../models/user"),
    middleware   = require("../middleware");

var options = {
  auth: {
    api_key: process.env.SG_API_KEY
  }
}
var mailer = nodemailer.createTransport(sgTransport(options));

// ============= Index Route ==================
router.get("/", function(req, res) {
    res.render("landing");
});
// ============================================

// ========= Authenticate Routes ==============
// -- Register Route
router.get("/register", function(req, res) {
    res.render("register", {pageSelect: 'register'});
});
// -- Create User Route
router.post("/register",
    middleware.loginValidation,
    middleware.registerValidation,
    middleware.findUniqueEmail, function(req, res) {

    var newUser = new User({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password
        });
    newUser.save(function (err) {
        if (err) {
          console.log(err);
          req.flash("error", err.message);
          return res.redirect("/register");
        }

        // Send registration / confirm? email

        req.logIn(newUser, function(err) {
          if (err) console.log(err);
          req.flash("success", "Welcome to YelpCamp " + user.username + "!");
          res.redirect("/campgrounds");
        });
    });
    /*
    User.register(newUser, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        req.flash("error", err.message);
        // display register form
        return res.redirect("/register");
      }
      passport.authenticate("local")(req, res, function() {
          req.flash("success", "Welcome to YelpCamp " + user.username + "!");
          res.redirect("/campgrounds");
      }); // end passport.authenticate
    }); // end User.register
    */
});
// -- Login Route
router.get("/login", function(req, res) {
    res.render("login", {pageSelect: 'login'});
});
/*
router.post("/login", middleware.loginValidation, passport.authenticate("local",
  {
    // successRedirect: "/campgrounds",
    // successFlash: "Welcome back!",
    failureRedirect: "/login",
    failureFlash: true
  }),
  function(req, res) {
    req.flash("success", "Welcome back " + req.user.username + "!");
    res.redirect("/campgrounds");
});
*/

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect('/login');
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect('/login');
      }
      req.flash("success", "Welcome back " + req.user.username + "!");
      return res.redirect('/campgrounds');
    });
  })(req, res, next);
});

// -- Logout Route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged out.");
    res.redirect("/campgrounds");
});
// ============================================

// -- User Profile
router.get("/profile", middleware.isLoggedIn, function(req, res) {
    res.render("profile/", {pageSelect: 'profile'});
});


// ============================================

// -- Forgot Password
router.get("/forgot", function(req, res) {
    res.render("forgot", {pageSelect: 'forgot'});
});

router.post("/forgot", function(req, res) {

    async.waterfall([
        function(done) {
          // generate new token
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          // find user by email address
          User.findOne({ email: req.body.email }, function(err, user) {
            if (!user) {
              req.flash('error', 'No account with that email address exists.');
              return res.redirect('/forgot');
            }

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {
          // send email
          var mailOptions = {
            to: user.email,
            from: 'no-reply-yc@peaceful-earth.yc.com',
            subject: 'YelpCamp | Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your YelpCamp account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/reset/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
          mailer.sendMail(mailOptions, function(err) {
              if (err) return done(err);
              req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
              done(err, 'done');
          });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });

});

router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {
        user: user,
        pageSelect: 'reset'
      })
    });
});

router.post('/reset/:token', middleware.changePasswordValidation, function(req, res) {

    async.waterfall([
      function(done) {
        // find user to reset token
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
      },
      function(user, done) {
        // send email
        var mailOptions = {
          to: user.email,
          from: 'no-reply-yc@peaceful-earth.yc.com',
          subject: 'YelpCamp | Your password has been changed',
          text: 'Hello,\n\n' +
          'This is a confirmation that the password for your YelpCamp account ' + user.username + ' has just been changed.\n'
        };
        mailer.sendMail(mailOptions, function(err) {
            if (err) return done(err);
            req.flash('success', 'Success! Your password has been changed.');
            done(err, 'done');
        });
      }
    ], function(err) {
        res.redirect('/campgrounds');
    });

});
// ============================================

module.exports = router;
