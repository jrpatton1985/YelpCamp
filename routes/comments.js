var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
// ============= Comments Routes ==============
// -- Comments New
router.get("/new", middleware.isLoggedIn, function(req, res) {
    // find campground by id
    Campground.findById(req.params.id, function(err, campground) {
        if (err) {
          console.log(err);
        } else {
          res.render("comments/new", {campground: campground});
        }
    });
});
// -- Comments Create
router.post("/", middleware.isLoggedIn, function(req, res) {
    // find campground by id
    Campground.findById(req.params.id, function(err, campground) {
        if (err) {
          redirect("/campgrounds");
        } else {
          // create new comments
          Comment.create(req.body.comment, function(err, comment){
              if (err) {
                req.flash("error", "Something went wrong.");
                res.redirect("/campgrounds/" + campground._id);
              } else {
                // add username and id to comment
                comment.author.id = req.user.id;
                comment.author.username = req.user.username;
                // save comment
                comment.save();
                // connect new comment to campground
                campground.comments.push(comment);
                // save campground
                campground.save();
                // redirect campground show page
                req.flash("success", "Successfully added comment.");
                res.redirect("/campgrounds/" + campground._id);
              }
          });
        }
    });
});
// -- Comment Edit Route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res) {
    // Find campground information
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
          res.redirect("back");
        } else {
          // Find comment to edit
          Comment.findById(req.params.comment_id, function(err, foundComment) {
              if (err) {
                res.redirect("back");
              } else {
                res.render("comments/edit", {campground: foundCampground, comment: foundComment});
              }
          });
        }
    });
});
// -- Comment Update Route
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
        if (err) {
          res.redirect("back");
        } else {
          req.flash("success", "Comment successfully updated.");
          res.redirect("/campgrounds/" + req.params.id);
        }
    });
});
// -- Delete Route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if (err) {
          res.redirect("back");
        } else {
          req.flash("success", "Comment successfully deleted.");
          res.redirect("/campgrounds/" + req.params.id);
        }
    });
});
// ============================================

module.exports = router;
