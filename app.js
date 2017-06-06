var express       = require("express"),
    app           = express(),
    path          = require("path"),
    favicon       = require("serve-favicon"),
    bodyParser    = require("body-parser"),
    session       = require("express-session"),
    cookieParser  = require("cookie-parser"),
    mongoose      = require("mongoose"),
    flash         = require("connect-flash"),
    passport      = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    expValidator  = require("express-validator"),
    MongoStore    = require("connect-mongo/es5")(session),
    nodemailer    = require("nodemailer"),
    bcrypt        = require("bcrypt-nodejs"),
    async         = require("async"),
    crypto        = require('crypto'),
    Campground    = require("./models/campground"),
    Comment       = require("./models/comment"),
    User          = require("./models/user"),
    seedDB        = require("./seeds");

// require routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index"),
    ratingRoutes     = require("./routes/ratings");
    uploadRoutes     = require("./routes/uploads");

// ============== Configuration ===============
// favicon
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// database
//seedDB();   // seed the database
mongoose.promise = global.Promise;
// connect to database either locally (mongodb://localhost/yelp_camp)
// or through Mongo Lab online (mongodb://pattonjim:ppbq635H@ds153710.mlab.com:53710/yelp_camp)
mongoose.connect(process.env.DATABASEURL);
// mongoose.connect("mongodb://localhost/yelp_camp");
// mongoose.connect("mongodb://pattonjim:ppbq635H@ds153710.mlab.com:53710/yelp_camp");
mongoose.connection.on('connected', function() {
    console.log('Default database connection open.');
});
mongoose.connection.on('disconnected', function() {
    console.log('Default database connection disconnected.');
});
mongoose.connection.on('error', function(err) {
    console.log('Default database connection error:' + err);
});

// view engine setup
app.set("view engine", "ejs");

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
        extended: true,
        limit: '50mb',
        parameterLimit: 1000000
      }));
app.use(expValidator());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

app.use(flash());
app.locals.moment = require('moment');
// Passport Config
app.use(cookieParser());
app.use(require("express-session")({
    secret: "Stewie is the most awesome cat ever!",
    cookie: {maxAge: 60 * 60 * 1000 * 24 },    // 1 Day
    resave: false,
    saveUninitialized: false,
    //store: new MongoStore({ url:process.env.DATABASEURL, autoReconnect: true })
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    });
  });
}));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// User & Flash information accessible to all routers
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// Multer Errors
app.use(function(err, res, res, next) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.send({ result: 'fail', error: { code: 1001, message: 'File is too big' } })
      return
    }
})

app.get("/*", function(req, res, next) {
    if (typeof req.cookies['connect.cid'] !== 'undefined') {
        console.log(req.cookies['connect.cid']);
    }
    next();
});

// 'use' routes
app.use(indexRoutes);
app.use("/campgrounds/", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/ratings", ratingRoutes);
app.use("/profile/uploads/", uploadRoutes);
// ============================================

// ================= Listener =================
var ip = process.env.IP || "192.168.1.130";
var port = process.env.PORT || 1337;
app.listen(port, function() {
    console.log("YelpCamp server has started.");
});
// ============================================
