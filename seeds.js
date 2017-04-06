var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
  {
    name: "Granite Hill",
    image: "https://farm8.staticflickr.com/7252/7626464792_3e68c2a6a5.jpg",
    description: "Bacon ipsum dolor amet drumstick chicken shoulder porchetta, chuck pork belly pork loin andouille tail cupim pig filet mignon. Ham cupim bresaola, pork loin shoulder shankle turducken meatball tenderloin sausage venison shank. Kielbasa porchetta ribeye short loin. Tenderloin ball tip jerky sirloin biltong salami boudin hamburger fatback turkey cow frankfurter. Strip steak flank landjaeger kevin swine."
  },
  {
    name: "Salmon Creek",
    image: "https://farm2.staticflickr.com/1281/4684194306_18ebcdb01c.jpg",
    description: "Tenderloin jerky ham landjaeger, alcatra doner capicola hamburger pork leberkas swine. Fatback tri-tip meatball turkey salami picanha. Tongue beef pork chop, fatback rump kielbasa tail pork belly cupim drumstick beef ribs. Strip steak corned beef biltong brisket flank, pork loin pastrami leberkas burgdoggen short ribs pork chop. Pork chop andouille pork pancetta. Shoulder beef pig pastrami picanha strip steak. Chicken filet mignon sausage pancetta venison pig biltong stri steak hamburger andouille short ribs turducken chuck."
  },
  {
    name: "Cloud's Rest",
    image: "https://farm9.staticflickr.com/8225/8524305204_43934a319d.jpg",
    description: "Jerky pork chop shoulder hamburger short loin picanha doner ground round alcatra filet mignon rump chuck. Leberkas tail bacon, cow turkey rump drumstick prosciutto short loin bresaola fatback pork loin pig. Capicola sausage short ribs, fatback meatball turducken burgdoggen boudin tri-tip cow bresaola jerky salami sirloin biltong. Ground round shank ball tip, t-bone meatball spare ribs ham hock jowl tenderloin boudin. Swine rump kielbasa, tri-tip ham hock ground round cupim prosciutto shank tenderloin strip steak burgdoggen pork meatball. Frankfurter flank shank, kevin rump sausage leberkas. Tri-tip pork chop kielbasa frankfurter shank."
  }
]

function seedDB() {
  // remove all campgrounds
  Campground.remove({}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("removed campgrounds");
        //Create campgrounds
        data.forEach(function(seed) {
            Campground.create(seed, function(err, campground) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("Campground created.");
                  // Create some comments
                  Comment.create(
                    {
                        text: "This place is great, but I wish there was internet.",
                        author: "Homer"
                    }, function(err, comment){
                        if (err) {
                          console.log(err);
                        } else {
                          campground.comments.push(comment);
                          campground.save();
                          console.log("create new comment");
                        }
                    });
                }
            });
        });
      }
  });

}


module.exports = seedDB;
