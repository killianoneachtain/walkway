'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const ImageStore = require('../utils/image-store');

const Guest = {
  guest: {
    auth: false,
    handler: async function(request, h) {
      const walkways = await Trail.find().populate('walkways').lean();
      //console.log(walkways);

      const users = await User.find( { type: { $ne: 'admin' } }).populate('users').lean();
      //console.log("USERS for GUEST are: ",users);

      const guest = true;

      // Guest user which has null values. No access to social features.
      //const guest = await User.findByID('5ed6c2e3d23245e1338f503b').lean();
      //console.log("GUEST is: ",guest);

      return h.view('guest_view', { title: 'Guest at Walkways', walkways: walkways, users: users, guest: guest });
    }
  },
  viewProfile: {
    auth: false,
    handler: async function(request, h) {
      try {
        const id = request.params.id;
        //console.log("Guest is trying to view USER: ", id);
        const user = await User.findById(id).lean();

        let username = user.firstName + ' ' + user.lastName;

        const guest = true;
        //console.log("GUEST is: ",guest);

        const walkways = await Trail.find( { creator: id }).populate('trail').lean();

        let POI_total = walkways.length;
        let total_images = 0;

        for (let i =0; i < walkways.length; i++)
        {
          let imageNumber = walkways[i].images.length;
          total_images = total_images + imageNumber;
        }

        return h.view('viewProfile', { title: 'Guest : ' + username + ' Details', walkways: walkways,
          user: user, POI_total: POI_total, total_images: total_images, guest: guest });
      }
      catch (err) {
        return h.view('main', { errors: [{ message: err.message }] });
      }
    }
  },
  viewTrail: {
    auth: false,
    handler: async function(request, h) {
      try {
        const guest = true;
        console.log("Guest PARAMS ARE: ", request.params);
        const trailID = request.params.trailId;
        let trail = await Trail.find( { _id : trailID }).lean();

        let current_trail = trail[0];

        let trail_name = current_trail.trailname;

        let trailImages = current_trail.images;

        let userImages = await ImageStore.getUserImages(trailID);

        let google = process.env.google_maps_API;

        return h.view('guest_POI', { title: trail_name + " Details" , trail: current_trail,
          google_API: google, guest: guest, images: userImages } );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }

  }

};

module.exports = Guest;