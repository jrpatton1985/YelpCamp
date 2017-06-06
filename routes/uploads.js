var express    = require("express"),
    router     = express.Router(),
    multer     = require("multer"),
    multerS3   = require("multer-s3"),
    AWS        = require("aws-sdk"),
    path       = require("path"),
    url        = require("url"),
    User       = require('../models/user');

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
        cb(null, "uploads/" + req.user._id + "/" + file.originalname);
    }
});
// ===============  Upload  =================
var maxSize = 10 * 1024 * 1024; // 10mb file size limit
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
}).single('uploads');


// ============= Upload Routes ================
router.get("/", function (req, res) {
    res.render("uploads/", {pageSelect: 'upload'});
});

// User Profile Avatar
router.post("/", function(req, res){
    upload(req, res, function(err) {
        if (err) {
          console.log(err);
          return res.send("An error occurred when uploading file.");
        }

        //console.log(req.file);
        // save new avatar to user's DB entry
        if (req.file) {
            var image = req.file.location;
        }
        var newData = {
          image: image
        }

        User.findByIdAndUpdate(req.user._id, {$set: newData}, function(err, user) {
            if (err) {
              console.log(err);
            } else {
              // return image location
              res.send(image);
            }
        });
    });
});
// ============================================

module.exports = router;
