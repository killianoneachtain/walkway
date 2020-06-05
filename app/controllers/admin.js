'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const ImageStore = require('../utils/image-store');
const cloudinary = require('cloudinary').v2;
const bCrypt = require('bcrypt');
const saltRounds = 10;

const Admin = {
  admin: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        if (user.type == 'user')
        {
          return h.redirect('/');
        }
        let type = "user";
        const members = await User.find({ type: type }).lean();

        let total_users = members.length;

        const assets = await cloudinary.api.resources( function(error, result) {console.log(result, error); });

        let total_resources = assets.resources.length;

        let total_images = 0;

        const rates = [assets.rate_limit_allowed, assets.rate_limit_remaining, assets.rate_limit_reset_at ];

        for (let i=0; i < assets.resources.length; i++)
        {
          if ( assets.resources[i].resource_type === 'image')
          {
            total_images++;
          }
        }


        return h.view('admin', { title: 'Administrator Home', user: user, members: members, total_users: total_users,
        total_resources: total_resources, total_images: total_images, rates: rates });
      }
      catch (err) {
        return h.view('login', { errors: [{ message: err.message }] });
      }
    }
  },
  deleteUser: {
    handler: async function(request, h) {
      try {
        const id = request.params.id;
        const user = await User.findById(id).lean();
        console.log("USER is ", user);
        const trails = await Trail.findByCreator(id).lean();

        let user_images=[];
        let profile_public_id= user.profilePID;
        let profile_folder = user._id + '/Profile_Picture';

        try {
          if (user.profilePicture !== "") {

            await ImageStore.deleteProfilePicture(profile_public_id);
            try {
                  await cloudinary.api.delete_folder(profile_folder, function(error, result) {
                  console.log(result);
                    });
                  } catch (err) {
                  console.log(err)
                  }
              }
            } catch(err) {
              console.log(err);
            }

        // *********
        // NEED TO ADD THE USER.profileImages array to the user_images array
        // *********

        if (user_images.length >= 0)
        {
          for (let index = 0; index < trails.length; index++) {
            let image_index = 0;
            let current_images = trails[index].images;
            for (image_index = 0; image_index < current_images.length; image_index++) {
              try {
                user_images.push(current_images[image_index]);
              } catch (err) {
                console.log(err);
              }
            }
          }

          for (let index = 0; index < user_images.length; index++) {
            try {
              await ImageStore.deleteImage(user_images[index]);
            } catch (err) {
              console.log(err);
            }
          }

          try {
            await cloudinary.api.delete_folder(user._id, function(error, result) {
              console.log(result);
            });
          } catch (err) {
            console.log(err);
          }
        }

        //delete the user id from all friends arrays;
        // delete the user id from all the friendRequest arrays;
        // delete the user id from all the requestsSent arrays;


        try {
          await Trail.deleteMany( { creator: user._id } );
        } catch (err) {
          console.log(err);
        }

        try {
          await User.deleteOne({ _id: user._id });
        } catch (err) {
          console.log(err);
        }

        let type = "user";
        const members = await User.find({ type: type }).lean();

        return h.redirect('/admin', {members: members});
      }
      catch (err) {
        return h.view('admin', { errors: [{ message: err.message }] });
      }
    }
   },
  viewUser: {
    handler: async function(request, h) {
      try {
        const id = request.params.id;
        const user = await User.findById(id).lean();

        let username = user.firstName + ' ' + user.lastName;

        const walkways = await Trail.find( { creator: id }).populate('trail').lean();

        let POI_total = walkways.length;
        console.log("POI Total is:", POI_total);

        let total_images = 0;

        for (let i =0; i < walkways.length; i++)
        {
          let imageNumber = walkways[i].images.length;
          total_images = total_images + imageNumber;
        }

        let userImages = await ImageStore.getUserImages(id);
        total_images = userImages.length;

        return h.view('adminViewUser', { title: username + ' Details', walkways: walkways,
          user: user, POI_total: POI_total, total_images: total_images, images: userImages});
      }
      catch (err) {
        return h.view('admin', { errors: [{ message: err.message }] });
      }
    }
  },
  deleteUserImage: {
    handler: async function(request, h) {
      try {
        const publicID = request.params.id + '/' + request.params.foldername + '/' + request.params.imagename;
        console.log("PublicID to delete image from is", publicID);
        await ImageStore.deleteImage(publicID);

        let trails= await Trail.findByName(request.params.foldername);
        let trail = trails[0];
        console.log("THE TRAIL IS : ", trail);
        let user = trail.creator;
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

        try {
          let updateImageArray = await Trail.updateOne({ _id: trail._id }, { $pull: { images: trailToBeDeleted } });
        } catch (err){
          console.log(err);
        }
        //console.log("Up Date image ARRAY result is: ",updateImageArray);
        //console.log("Delete image from Gallery is ", update_Trail);
        trail.save();

        return h.redirect('/viewUser/' + user );
      } catch (err) {
        console.log(err);
      }
    }
  },
  resetPassword: {
    validate: {
      payload: {
        new_password: Joi.string()
          .min(8)
          .max(15)
          .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/)
          //.error((errors) => ('"Password" requires at least ONE special character.'))
          .required().required(),
        confirm_password: Joi.ref('new_password')
      },
      options: {
        abortEarly: false
      },
      failAction: async function(request, h, error) {
        const id = request.params.id;
        const user = await User.findById(id).lean();
        if (!user) {
          throw Boom.unauthorized();
        }
        const walkways = await Trail.find( { creator: id }).populate('trail').lean();
        let POI_total = walkways.length;
        let total_images = 0;
        for (let i =0; i < walkways.length; i++)
        {
          let imageNumber = walkways[i].images.length;
          total_images = total_images + imageNumber;
        }
        return h.view('viewUser', {
            title: 'Password Reset error',
            errors: error.details,
            walkways: walkways,
            user: user,
            POI_total: POI_total,
            total_images: total_images
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {
      try {
        const id = request.params.id;
        const user = await User.findById(id);
        if (!user) {
          throw Boom.unauthorized();
        }

        user.password = await bCrypt.hash(request.payload.new_password, saltRounds);    // ADDED
        await user.save();

        return h.redirect('/viewUser/' + user._id, {user: user });
      } catch (err)
      {
        console.log(err);
      }
    }
  }
};

module.exports = Admin;