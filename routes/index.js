var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

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
router.post("/register", function(req, res) {
    // Handle user registration
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        req.flash("error", err.message);
        // display register form
        return res.redirect("register");
      }
      passport.authenticate("local")(req, res, function() {
          req.flash("success", "Welcome to YelpCamp " + user.username + "!");
          res.redirect("/campgrounds");
      }); // end passport.authenticate
    }); // end User.register
});
// -- Login Route
router.get("/login", function(req, res) {
    res.render("login", {pageSelect: 'login'});
});
router.post("/login", passport.authenticate("local",
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
// ============================================

module.exports = router;
