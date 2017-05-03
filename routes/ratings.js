var express       = require('express'),
    router        = express.Router({mergeParams: true}),
    Campground    = require('../models/campground'),
    Rating        = require('../models/rating'),
    middlewareObj = require('../middleware');

// =============== Rating Post =================
router.post('/', middlewareObj.isLoggedIn, middlewareObj.checkRatingExists, function(req, res, next) {
    // Find campground to rate
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
            req.flash('error', err.message);
            res.redirect('back');
        } else if (req.body.rating) {
            // if rating posted
            Rating.create(req.body.rating, function(err, rating) {
                if (err) {
                    req.flash('error', err.message);
                    res.redirect('back');
                } else {
                    // create rating
                    rating.author.id = req.user.id;
                    rating.author.username = req.user.username;
                    rating.save();
                    foundCampground.ratings.push(rating);
                    foundCampground.save();
                    req.flash('success', "Thank you for the feedback.");
                    res.redirect("/campgrounds/" + foundCampground._id);
                }
            });
        } else {
            req.flash('error', "Please select a rating.");
            res.redirect("/campgrounds/" + foundCampground._id);
        }
        // res.redirect("/campgrounds/" + foundCampground._id);
    });
});

module.exports = router;
