var express    = require("express"),
    router     = express.Router(),
    geocoder   = require("geocoder"),
    multer     = require("multer"),
    multerS3   = require("multer-s3"),
    AWS        = require("aws-sdk"),
    path       = require("path"),
    url        = require("url"),
    Campground = require("../models/campground"),
    Comment    = require("../models/comment"),
    middleware = require("../middleware");

function sanitizeCampground(req, res) {
    req.sanitize('name').trim();
    req.sanitize('price').trim();
    req.sanitize('image').trim();
    req.sanitize('location').trim();
    req.sanitize('description').trim();
}

function validateCampground(req, res) {
    req.check('name', 'Campground name is required.').notEmpty();
    req.check('price', 'Campground price is required.').notEmpty();
    req.check('location', 'Campground location is required.').notEmpty();
    req.check('description', 'Campground description is required.').notEmpty();

    return req.validationErrors();
}

function getCampgroundImage(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
          req.flash("error", "Campground not found.");
          res.redirect("back");
        } else {
          console.log(foundCampground);
          return foundCampground.image;
        }
    });
}

 /*
  Pagination provided by: Roman Tuomisto
  URL: https://www.udemy.com/the-web-developer-bootcamp/learn/v4/questions/1646592
 */
// =============== Pagination =================
function paginate(req, res, next) {
    var perPage = 4;
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

                      //console.log(output);
                      res.render("campgrounds/index", {
                          campgrounds: allCampgrounds,
                          output: output,
                          pageSelect: 'campgrounds'
                      });
              });
    });
}

// ============== Upload AWS ================
// load AWS credentials from environment variables, by default
var s3 = new AWS.S3();
s3.config.update({
  signatureVersion: 'v4'
});
var s3_Bucket = process.env.S3_BUCKET;
var storage = multerS3({
    s3: s3,
    bucket: s3_Bucket,
    acl: 'public-read',
    metadata: function(req, file, cb) {
        cb(null, {fieldName: file.fieldname});
    },
    key: function(req, file, cb) {
        cb(null, "uploads/" + Date.now().toString() + "-" + file.originalname);
    }
});

/* ===============  Upload  =================
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, './public/uploads');
    },
    filename: function(req, file, callback) {
      callback(null, Date.now() + '-' + file.originalname);
    }
});
// ===============  Upload  ================= */

var maxSize = 10 * 1024 * 1024;
var upload = multer({
  storage : storage,
  fileFilter: function(req, file, callback) {
			var ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
				return callback(new Error('Only images are allowed'), null);
			}
			callback(null, true);
    },
  limits: { fileSize: maxSize }
}).single('image');

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
    res.render("campgrounds/new", {pageSelect: 'new'});
});
// -- Show Route
router.get("/:id", function(req, res) {
    // find campground by id
    Campground.findById(req.params.id).populate("comments").populate("ratings").exec(function(err, foundCampground) {
        if (err) {
          console.log(err);
          req.flash("error", err.message);
          res.redirect('/campgrounds');
        } else {
          // calculate and save rating
          if (foundCampground.ratings.length > 0) {
              var ratings = [];
              var length = foundCampground.ratings.length;
              foundCampground.ratings.forEach(function(rating) {
                  ratings.push(rating.rating);
              });
              var rating = ratings.reduce(function(total, element) {
                  return total + element;
              });
              foundCampground.rating = rating / length;
              foundCampground.save();
          }

          // console.log("Ratings: ", foundCampground.ratings);
          // console.log("Campground Rating: ", foundCampground.rating);
          // console.log("Campground: ", foundCampground);
          // render show template with that information
          res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});
// -- Create Route
router.post("/", middleware.isLoggedIn, function(req, res) {

    upload(req, res, function(err) {
        if (err) {
          console.log(err);
          return res.send("An error occurred when uploading file.");
        }

        // Sanitize and validate campground input
        sanitizeCampground(req, res);
        var errors = validateCampground(req, res);

        if (errors) {
            var msg = [];
            errors.forEach(function(error) {
                msg.push(error.msg);
            });
            req.flash("error", msg);
            res.redirect('back');
        } else {

            // get data from form and add to campground array
            var name = req.body.name;
            var price = req.body.price;

            //var image = req.body.image;
            if (req.file) {
                //console.log(req.file);
                //var image = '/uploads/' + req.file.filename;
                // S3 object?
                var image = req.file.location;
            } else {
                var image = '/uploads/no-image.jpg';
            }

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
                }); // Campground.create
            });     // geocoder.geocode
        }           // if (errors)
    });             // upload
});
// -- Edit Route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    // Find and pass the campground to be editted
    Campground.findById(req.params.id, function(err, foundCampground) {
        // parse campground image path
        // var imgFile = path.parse(foundCampground.image).base;
        res.render("campgrounds/edit", {campground: foundCampground, pageSelect: 'edit'});
    });
});
// -- Update Route
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {

    upload(req, res, function(err) {
        console.log(req.file);
        if (err) {
          return res.send("An error occurred when uploading file.");
        }

        // Sanitize and validate campground input
        sanitizeCampground(req, res);
        var errors = validateCampground(req, res);

        if (errors) {
            var msg = [];
            errors.forEach(function(error) {
                msg.push(error.msg);
            });
            req.flash("error", msg);
            res.redirect('back');
        } else {
            if (req.body.removeImage) {
                req.body.image = '/uploads/no-image.jpg';
            } else if (req.file) {
                //req.body.image = '/uploads/' + req.file.filename;

                // delete old file
                var oldKey = url.parse(req.body.origImage).pathname.substr(1);
                var params = {
                    Bucket: process.env.S3_BUCKET,
                    Key: oldKey
                };
                s3.deleteObject(params, function(err, data) {
                    if (err) console.log(err, err.stack);
                });

                // set new file location
                req.body.image = req.file.location;
            } else {
                req.flash("error", "Please choose an Image file or check 'Remove Image'.");
                return res.redirect("/campgrounds/" + req.params.id + "/edit");
            }
            // find and save location
            geocoder.geocode(req.body.location, function (err, data) {
                var lat = data.results[0].geometry.location.lat;
                var lng = data.results[0].geometry.location.lng;
                var location = data.results[0].formatted_address;

                var newData = {
                  name: req.body.name,
                  price: req.body.price,
                  image: req.body.image,
                  description: req.body.description,
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
                      req.flash("success", updatedCampground.name + " Campground successfully updated.");
                      res.redirect("/campgrounds/" + req.params.id);
                    }
                }); // Campground.findByIdAndUpdate
            });     // geocoder.geocode
        }           // if (errors)
    });             // upload
});
// -- Destory Route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
      if (err) {
          res.redirect("/campgrounds");
      } else {

        // delete image file
        var oldKey = url.parse(foundCampground.image).pathname.substr(1);
        var params = {
            Bucket: process.env.S3_BUCKET,
            Key: oldKey
        };
        s3.deleteObject(params, function(err, data) {
            if (err) console.log(err, err.stack);
        });

        Comment.remove({"_id": {"$in": foundCampground.comments}}, function(err) {
            if (err) {
                res.redirect("/campgrounds");
            } else {
                foundCampground.remove(function(err) {
                    if (err) {
                        req.flash("error", err.message);
                        res.redirect("/campgrounds");
                    } else {
                        req.flash("success", "Campground successfully deleted.");
                        res.redirect("/campgrounds");
                    }
                });
            }
        });
      }
    });
});
// ============================================

module.exports = router;
