'use strict';

const ImageStore = require('../utils/image-store');
const Trail = require('../models/trail');
const User = require('../models/user');
const Event = require('../models/events');

const Gallery = {
  index: {
    handler: async function(request, h) {
      try {
        const allImages = await ImageStore.getAllImages();
        return h.view('gallery', {
          title: 'Cloudinary Gallery',
          images: allImages
        });
      } catch (err) {
        console.log(err);
      }
    }
  },
  uploadFile: {
    handler: async function(request, h) {
      try {
        const user_id = request.auth.credentials.id;
        const trailID = request.params.id;

        const file = request.payload.imagefile;
        if (Object.keys(file).length > 0)
        {
          let upload = await ImageStore.uploadImage(request.payload.imagefile, user_id, trailID);
          //console.log("Image upload was: ", upload);

          let user = await User.findOne( { _id: user_id } ).lean();
          let trail = await Trail.findOne( { _id: trailID } ).lean();

          console.log("Gallery User is:", user);
          console.log("Gallery Trail is:", trail);

          // Create an Event here to say user has added a Picture to a trail
          let now = new Date();
          let here = now.getTime();

          let profilePic='';
          if (user.profilePicture === '')
          {
            profilePic = '/images/default_user.png';
          }
          else
          {
            profilePic = user.profilePicture;
          }

          let dateString = now.getUTCFullYear() + "/" +
            ("0" + (now.getUTCMonth()+1)).slice(-2) + "/" +
            ("0" + now.getUTCDate()).slice(-2) + " " +
            ("0" + now.getUTCHours()).slice(-2) + ":" +
            ("0" + now.getUTCMinutes()).slice(-2) + ":" +
            ("0" + now.getUTCSeconds()).slice(-2);
          //console.log(dateString);

          let signUpCard = "<div class=\"ui fluid card\">\n" +
            "  <div class=\"content\">\n" +
            "    <div class=\"header\">New Image posted to Trail.</div>\n" +
            "    <div class=\"meta\">" + dateString + "</div>\n" +
            "    <div class=\"description\">\n" +
            "      <p>" + user.firstName + ' ' + user.lastName + " has posted a new image for our community to the Walkway : " + trail.trailname + ". </p>\n" +
            "    </div>\n" +
            "  </div>\n" +
            "  <div class=\"extra content\">\n" +
            "    <div class=\"author\">\n" +
            "      <img class=\"ui avatar image\" src=\"" + profilePic + "\">" + user.firstName + " " + user.lastName + "\n" +
            "    </div>\n" +
            "  </div>\n" +
            "</div>";

          //console.log("SignUp card is", signUpCard);

          const newEvent = new Event({
            creator: user._id,
            eventTime: here,
            category: "friends",
            event: signUpCard
          });
          await newEvent.save();

          return h.redirect('/viewPOI/'+ trailID);

        }


        return h.redirect('/viewPOI/' + trailID, {
          title: 'UPLOAD ERROR!',
          error: 'No file selected'
        });
      } catch (err) {
        console.log(err);
      }
    },
    payload: {
      multipart: true,
      output: 'data',
      maxBytes: 209715200,
      parse: true
    }
  },
  deleteImage: {
    handler: async function(request, h) {

      try {
        let publicID = request.params.id + '/' + request.params.foldername + '/' + request.params.imagename;
        await ImageStore.deleteImage(publicID);

        //need to delete the index from the trail images array here

        let trails= await Trail.findByName(request.params.foldername);
        let trail = trails[0];
        //console.log("TRail to delete image from is", trail);

        let trailImages = trail.images;
        let trailToBeDeleted = '';
        let i =0;

        for (i=0;i<trailImages.length;i++)
        {
          let n = trailImages[i].search(publicID);
          if (n >= 0){
            trailToBeDeleted = trailImages[i];
          }
        }

        //console.log("TRAIL IMAGES ARE : ",trail.images);

        //console.log("Trail to be deleted is : ", trailToBeDeleted);


        let updateImageArray = await Trail.updateOne( { _id: trail._id }, { $pull: { images: trailToBeDeleted } } );
        //console.log("Up Date image ARRAY result is: ",updateImageArray);

        //console.log("Delete image from Gallery is ", update_Trail);

        trail.save();

        return h.redirect('/viewPOI/' + trail._id);
      } catch (err) {
        console.log(err);
      }
    }
  },
  uploadProfilePicture: {
    handler: async function(request, h) {
      try {
        const user_id = request.auth.credentials.id;
        let user = await User.findOne( { _id: user_id } ).lean();

        const file = request.payload.imagefile;
        if (Object.keys(file).length > 0) {
          await ImageStore.uploadProfilePicture(request.payload.imagefile, user_id);

          // Create an Event here to say user has uploaded a profilePicture
          let now = new Date();
          let here = now.getTime();

          let dateString = now.getUTCFullYear() + "/" +
            ("0" + (now.getUTCMonth()+1)).slice(-2) + "/" +
            ("0" + now.getUTCDate()).slice(-2) + " " +
            ("0" + now.getUTCHours()).slice(-2) + ":" +
            ("0" + now.getUTCMinutes()).slice(-2) + ":" +
            ("0" + now.getUTCSeconds()).slice(-2);
          //console.log(dateString);

          user = await User.findOne( { _id: user_id } ).lean();

          let signUpCard = "<div class=\"ui fluid card\">\n" +
            "  <div class=\"content\">\n" +
            "    <div class=\"header\">New Profile Picture</div>\n" +
            "    <div class=\"meta\">" + dateString + "</div>\n" +
            "    <div class=\"description\">\n" +
            "      <p>" + user.firstName + ' ' + user.lastName + " has changed their Profile Picture. </p>\n" +
            "    </div>\n" +
            "  </div>\n" +
            "  <div class=\"extra content\">\n" +
            "    <div class=\"author\">\n" +
            "      <img class=\"ui avatar image\" src=\"" + user.profilePicture + "\">" + user.firstName + "\n" +
            "    </div>\n" +
            "  </div>\n" +
            "</div>";

          //console.log("SignUp card is", signUpCard);

          const newEvent = new Event({
            creator: user._id,
            eventTime: here,
            category: "friends",
            event: signUpCard
          });
          const event = await newEvent.save();

          return h.redirect('/settings');
        }
        return h.redirect('/settings', {
          title: 'UPLOAD ERROR!',
          error: 'No file selected'
        });
      } catch (err) {
        console.log(err);
      }
    },
    payload: {
      multipart: true,
      output: 'data',
      maxBytes: 209715200,
      parse: true
    }
  },
};

module.exports = Gallery;
