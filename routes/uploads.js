var express    = require("express"),
    router     = express.Router(),
    multer     = require("multer"),
    multerS3   = require("multer-s3"),
    AWS        = require("aws-sdk"),
    path       = require("path"),
    url        = require("url"),
    requestImageSize = require('request-image-size'),
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
var maxSize = 3 * 1024 * 1024;  // 3mb file size limit
var imgDimensions = {           // 275 x 250 image dimensions limit
  w: 275,
  h: 250
}
var upload = multer({
  storage : storage,
  fileFilter: function(req, file, callback) {
			var ext = path.extname(file.originalname).toLowerCase();
      // console.log(ext);
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
				return callback(new Error('Only images are allowed'), null);
			}
			callback(null, true);
    },
  limits: { fileSize: maxSize }
}).single('uploads');
// ===============  Helpers  =================
function deleteImage(req, res) {
    var oldKey = url.parse(req.file.location).pathname.substr(1);
    if (oldKey != 'uploads/no-image.jpg') {
      var params = {
          Bucket: process.env.S3_BUCKET,
          Key: oldKey
      };
      s3.deleteObject(params, function(err, data) {
          if (err) console.log(err, err.stack);
      });
    }
}

// ============= Upload Routes ================
router.get("/", function (req, res) {
    res.render("uploads/", {pageSelect: 'upload'});
});

// User Profile Avatar
router.post("/", function(req, res){
    upload(req, res, function(err) {
        if (err) {
          console.log(err);
          // invalid image format
          if (err.message === 'Only images are allowed') {
              return res.status(400).send('FORMAT_NOT_SUPPORTED');
          }
          // file size exceeds maxSize
          if (err.message === 'File too large') {
              return res.status(400).send('FILE_TOO_LARGE');
          }

          return res.status(500).send('UNCAUGHT_ERROR');
        }

        // check image
        requestImageSize(req.file.location, function(err, size, downloaded) {
            if (err) {
              console.log(err);
              return res.send('An error occurred when uploading file.');
            }

            if (size) {
              // console.log('Image is %dpx x %dpx.', size.width, size.height);
              // check image dimensions
              if (size.width > imgDimensions.w || size.height > imgDimensions.h) {
                  // delete image from bucket and throw error
                  deleteImage(req, res);
                  return res.status(400).send('DIMENSIONS_TOO_LARGE');
              } else {
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
              }
            }
        });
    });
});
// ============================================

module.exports = router;
