var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

// =========== Campground Routes ==============
// -- Index Route
router.get("/", function(req, res) {
    // get all campgrounds from db
    Campground.find({}, function(err, allCampgrounds) {
        if (err) {
          console.log(err);
        } else {
          res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds'});
        }
    });
});
// -- New Route
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new");
});
// -- Show Route
router.get("/:id", function(req, res) {
    // find campground by id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
        if (err) {
          console.log(err);
        } else {
          // render show template with that information
          res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});
// -- Create Route
router.post("/", middleware.isLoggedIn, function(req, res) {
    // get data from form and add to campground array
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var description = req.body.description;
    // get user and id of campground creator
    var author = {
      id: req.user._id,
      username: req.user.username
    };
    var newCampground = {
      name: name,
      price: price,
      image: image,
      description: description,
      author: author
    };
    // Create a new campground and save to database
    Campground.create(newCampground, function(err, newlyCreated) {
        if (err) {
          console.log(err);
        } else {
          // redirect back to campgrounds page
          req.flash("success", "Campground successfully created.");
          res.redirect("/campgrounds/" + newlyCreated._id);
        }
    });
});
// -- Edit Route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    // Find and pass the campground to be editted
    Campground.findById(req.params.id, function(err, foundCampground) {
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});
// -- Update Route
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    // find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
        if (err) {
          res.redirect("/campgrounds");
        } else {
          // redirect to show page
          req.flash("success", "Campground successfully updated.");
          res.redirect("/campgrounds/" + req.params.id);
        }
    });
});
// -- Destory Route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err) {
      if (err) {
        res.redirect("/campgrounds");
      } else {
        req.flash("success", "Campground successfully deleted.");
        res.redirect("/campgrounds");
      }
    });
});
// ============================================

module.exports = router;
