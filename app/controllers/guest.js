'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');

const Guest = {
  guest: {
    auth: false,
    handler: async function(request, h) {
      const walkways = await Trail.find().populate('walkways').lean();
      console.log(walkways);

      const users = await User.find( { type: { $ne: 'admin' } }).populate('users').lean();
      console.log("USERS for GUEST are: ",users);

      // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
      /*let trailTypes=[];
      console.log("Trailtypes are : ", trailTypes);
      trailTypes = Trail.returnTrailTypes();
      console.log("Trailtypes are : ", trailTypes);
      let unique = [...new Set(trailTypes)];
      console.log("Trailtypes are : ", unique);*/

      return h.view('guest_view', { title: 'Guest at Walkways', walkways: walkways, users: users });
    }
  },
  viewProfile: {
    auth: false,
    handler: async function(request, h) {
      try {
        const id = request.params.id;
        console.log("Guest is trying to view USER: ", id);
        const user = await User.findById(id).lean();

        let username = user.firstName + ' ' + user.lastName;

        const walkways = await Trail.find( { creator: id }).populate('trail').lean();

        let POI_total = walkways.length;

        let total_images = 0;

        for (let i =0; i < walkways.length; i++)
        {
          let imageNumber = walkways[i].images.length;
          total_images = total_images + imageNumber;
        }

        //let userImages = await ImageStore.getUserImages(id);

        return h.view('viewProfile', { title: username + ' Details', walkways: walkways,
          user: user, POI_total: POI_total, total_images: total_images});
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
        let trailId = request.params.id;
        const trail = Trail.findOne( { _id: trailId } );


      }
      catch (err) {
        return h.view('main', { errors: [{ message: err.message }] });
      }
    }

  }

};

module.exports = Guest;