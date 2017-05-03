var mongoose = require("mongoose");
// schema
var campgroundSchema = new mongoose.Schema({
  name: String,
  price: String,
  image: String,
  description: String,
  location: String,
  lat: Number,
  lng: Number,
  createdAt: { type: Date, default: Date.now },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ],
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating"
    }
  ],
  rating: { type: Number, default: 0 }
});
module.exports = mongoose.model("Campground", campgroundSchema);
