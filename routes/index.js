var express      = require("express"),
    router       = express.Router(),
    passport     = require("passport"),
    User         = require("../models/user"),
    middleware   = require("../middleware");


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
router.post("/register", middleware.loginValidation, function(req, res) {

    // Sanitize
    req.sanitize('password2').trim();
    // console.log(req.body.username);
    // console.log(req.body.password);

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
        res.redirect("/register");
    } else {
        // Passed

        var newUser = new User({username: req.body.username});
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
    }
});
// -- Login Route
router.get("/login", function(req, res) {
    res.render("login", {pageSelect: 'login'});
});
router.post("/login", middleware.loginValidation, passport.authenticate("local",
  {
    // successRedirect: "/campgrounds",
    // successFlash: "Welcome back!",
    failureRedirect: "/login",
    failureFlash: true
  }), function(req, res) {
    req.flash("success", "Welcome back " + req.user.username + "!");
    res.redirect("/campgrounds");
});
// -- Logout Route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged out.");
    res.redirect("/campgrounds");
});

// -- User Profile
router.get("/profile", middleware.isLoggedIn, function(req, res) {
    res.render("profile/", {pageSelect: 'profile'});
});

// ============================================

module.exports = router;
