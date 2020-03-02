'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const cloudinary = require('cloudinary');


const Admin = {
  admin: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        let type = "user";
        const members = await User.find({ type: type }).lean();

        console.log("Admin is : ", user);
        return h.view('admin', { title: 'Administrator Home', user: user, members: members });
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

        const trailID = request.params.id;
        await Trail.findOneAndDelete( { _id : trailID });

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
        console.log("This is the USER to be deleted : ", user);



        return h.redirect('/admin', {members: members});
      }
      catch (err) {
        return h.view('admin', { errors: [{ message: err.message }] });
      }
    }
  }
};

module.exports = Admin;