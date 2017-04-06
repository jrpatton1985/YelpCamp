var Campground = require("../models/campground");
var Comment = require("../models/comment");
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

middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // Set flash message
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/login");
}
// ============================================

module.exports = middlewareObj;
