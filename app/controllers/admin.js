'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const ImageStore = require('../utils/image-store');
const cloudinary = require('cloudinary');


const Admin = {
  admin: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        let type = "user";
        const members = await User.find({ type: type }).lean();

        let total_users = members.length;

        return h.view('admin', { title: 'Administrator Home', user: user, members: members, total_users: total_users });
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

        const trails = await Trail.findByCreator(id).lean();
        let user_images=[];
        let index = 0;
        for (index=0; index< trails.length; index++)
        {
          let image_index = 0;
          let current_images = trails[index].images;
          for (image_index = 0; image_index < current_images.length; image_index++)
          {
            try {
              user_images.push(current_images[image_index]);
              } catch (err) {
                  console.log(err);
              }
          }
        }

        for (index = 0; index < user_images.length; index++)
        {
          try {
            await ImageStore.deleteImage(user_images[index]);
          } catch (err) {
            console.log(err);
          }
        }

        try{
          await cloudinary.api.delete_folder(user._id , function(error, result){console.log(result);});
        } catch (err) {
          console.log(err);
        }


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
        console.log("Trying to view user: ", user);

        let username = user.firstName + ' ' + user.lastName;

        const walkways = await Trail.find( { creator: id }).populate('trail').lean();

        let POI_total = walkways.length;

        return h.view('viewUser', { title: username + ' Details', walkways: walkways,
          user: user, POI_total: POI_total});
      }
      catch (err) {
        return h.view('admin', { errors: [{ message: err.message }] });
      }
    }
  }
};

module.exports = Admin;