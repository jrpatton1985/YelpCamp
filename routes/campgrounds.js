var express = require("express");
var router = express.Router();
var geocoder = require("geocoder");
var Campground = require("../models/campground");
var middleware = require("../middleware");


/*
  Pagination provided by: Roman Tuomisto
  URL: https://www.udemy.com/the-web-developer-bootcamp/learn/v4/questions/1646592
 */
// =============== Pagination =================
function paginate(req, res, next) {
    var perPage = 8;
    var page = req.params.page || 1;
    var output = {
        data: null,
        pages: {
            current: page,
            prev: 0,
            hasPrev: false,
            next: 0,
            hasNext: false,
            total: 0
        },
        items: {
            begin: ((page * perPage) - perPage) + 1,
            end: page * perPage,
            total: 0
        }
    };
    Campground.find({})
              .skip((page - 1) * perPage)
              .limit(perPage)
              .exec(function(err, allCampgrounds) {
                  if (err) return next(err.message);

                  Campground.count().exec(function (err, count) {
                      if (err) return next(err.message);

                      output.items.total = count;
                      output.data = allCampgrounds;
                      output.pages.total = Math.ceil(output.items.total / perPage);
                      if (output.pages.current < output.pages.total) {
                          output.pages.next = Number(output.pages.current) + 1;
                      } else {
                          output.pages.next = 0;
                      }
                      output.pages.hasNext = (output.pages.next !== 0);
                      output.pages.prev = output.pages.current - 1;
                      output.pages.hasPrev = (output.pages.prev !== 0);
                      if (output.items.end > output.items.total) {
                        output.items.end = output.items.total;
                      }
                      res.render("campgrounds/index", {
                          campgrounds: allCampgrounds,
                          output: output,
                          pageSelect: 'campgrounds'
                  });
              });
    });
}

/* -- Index Route
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
*/
// -- Index Pagination Route
router.get("/", function(req, res, next) {
    paginate(req, res, next);
});
// -- Get Pagination Route (next page)
router.get("/page/:page", function(req, res, next) {
    paginate(req, res, next);
});

// =========== Campground Routes ==============
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

    geocoder.geocode(req.body.location, function (err, data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;

        var newCampground = {
          name: name,
          price: price,
          image: image,
          description: description,
          author: author,
          location: location,
          lat: lat,
          lng: lng
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

    geocoder.geocode(req.body.location, function (err, data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;

        var newData = {
          name: req.body.campground.name,
          price: req.body.campground.price,
          image: req.body.campground.image,
          description: req.body.campground.description,
          location: location,
          lat: lat,
          lng: lng
        }

        // find and update the correct campground
        Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedCampground) {
            if (err) {
              req.flash("error", err.message);
              res.redirect("back");
            } else {
              // redirect to show page
              req.flash("success", "Campground successfully updated.");
              res.redirect("/campgrounds/" + req.params.id);
            }
        });
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
