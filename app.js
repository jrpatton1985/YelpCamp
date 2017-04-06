var express       = require("express"),
    app           = express(),
    path          = require("path"),
    favicon       = require("serve-favicon"),
    bodyParser    = require("body-parser"),
    mongoose      = require("mongoose"),
    flash         = require("connect-flash"),
    passport      = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground    = require("./models/campground"),
    Comment       = require("./models/comment"),
    User          = require("./models/user"),
    seedDB        = require("./seeds")

// require routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index")

// ============== Configuration ===============
// favicon
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
// database
//seedDB();   // seed the database

// connect to database either locally (mongodb://localhost/yelp_camp)
// or through Mongo Lab online (mongodb://pattonjim:ppbq635H@ds153710.mlab.com:53710/yelp_camp)
mongoose.connect(process.env.DATABASEURL);
// mongoose.connect("mongodb://localhost/yelp_camp");
// mongoose.connect("mongodb://pattonjim:ppbq635H@ds153710.mlab.com:53710/yelp_camp");

// view engine setup
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
// Passport Config
app.use(require("express-session")({
    secret: "Stewie is the most awesome cat ever!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// User & Flash information accessible to all routers
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// 'use' routes
app.use(indexRoutes);
app.use("/campgrounds/", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
// ============================================

// ================= Listener =================
var ip = process.env.IP || "192.168.1.130";
var port = process.env.PORT || 1337;
app.listen(port, ip, function() {
    console.log("YelpCamp server has started at: " + ip + ":" + port);
});
// ============================================
