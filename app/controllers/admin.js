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

        const assets = await cloudinary.api.resources( /*function(error, result) {console.log("Cloudinary Error: ",error); }*/);

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
        //console.log("USER is ", user);
        const trails = await Trail.findByCreator(id).lean();

        //************* Delete all user comments from trails
        let userComments = user.comments;
        console.log("the users comments are:", userComments);

        try {
          if (userComments.length > 0) {
            for (let i = 0; i < userComments.length; i++) {
              try {
                //let deleteAll =  await User.updateOne({ _id: userId }, { $pull: { friendRequests: friendID } }).lean();
                let commentID = userComments[i].commentID;
                console.log("The comment Id is", commentID);
                let trailID = userComments[i].commentTrailID;
                console.log("The trailID is : ", trailID)
                let deleteAll = await Trail.updateOne({ _id: trailID }, { $pull: { comments: { _id: commentID } } });
                console.log("DELETE ALL COMMENTS ARE: ", deleteAll);
              } catch (err) {
                console.log(err);
              }
            }
            console.log("All USER comments deleted.");
          }
        } catch(err)
        {
          console.log(err);
        }

        //************* Delete All User Images and Folders from Cloudinary
        console.log("Here deleting the Images and Folders");
        let user_images= user.allImages;
        console.log("User Images are", user_images);

        let profile_folder = user._id + '/Profile_Picture';
        try {
              if (user_images.length > 0) {

                for (let i = 0; i < user_images.length; i++) {
                  try {
                    await ImageStore.deleteImage(user_images[i]);
                  } catch(err)
                  {
                    console.log("Error with deleting Image for user",err);
                  }
                }
                try {
                  await cloudinary.api.delete_folder(profile_folder, function(error, result) {
                    //console.log(result);
                  });
                } catch (err) {
                  console.log(err)
                }
                try {
                  await cloudinary.api.delete_folder(user._id, function(error, result) {
                    //console.log(result);
                  });
                } catch (err) {
                  console.log(err);
                }
              }
          } catch(err) {
            console.log(err);
          }



        // Delete User from all Friend status arrays of other Users

        // delete the user id from all friends arrays;

        let friends = user.friends;
        if (friends.length > 0){
          for (let i = 0; i < friends.length; i++) {
            try {
              await User.updateOne( { _id: friends[i] }, { $pull: { friends : user._id } } );
            } catch(err)
            {
              console.log("Error Deleting Friends", err);
            }
          }
        }


        // delete the user id from all the friendRequest arrays;
        // delete the user id from all the requestsSent arrays;



        // Delete all tr
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
        //console.log("POI Total is:", POI_total);

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
        //console.log("PublicID to delete image from is", publicID);
        await ImageStore.deleteImage(publicID);

        let trails= await Trail.findByName(request.params.foldername);
        let trail = trails[0];
        //console.log("THE TRAIL IS : ", trail);
        let userID = trail.creator;
        //console.log("TRail to delete image from is", trail);

        //Need to delete the PID from users image list;
        //await Trail.updateOne( { _id: trail._id}, { $pull: { images: publicID} });

        try {
          let updateImageArray = await Trail.updateOne({ _id: trail._id }, { $pull: { images: publicID } });
        } catch (err){
          console.log(err);
        }
        //console.log("Up Date image ARRAY result is: ",updateImageArray);
        //console.log("Delete image from Gallery is ", update_Trail);
        trail.save();

        return h.redirect('/viewUser/' + userID );
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