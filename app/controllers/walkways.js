'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Accounts = require('../controllers/accounts');

const Walkways = {
  home: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      console.log(user);
      const walkways = await Trail.find( { creator: id }).populate('trail').lean();
      return h.view('home', { title: 'Welcome to Walkways', walkways: walkways, user: user});
    }
  },
  admin: {
    handler: function(request, h) {
      return h.view('admin', { title: 'Administrator Home' });
    }
  },
  trailform: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      return h.view('addPOI', { title: 'Add Trail to your Walkways' });
    }

  },
  addtrail: {
     handler: async function(request, h) {
       const id = request.auth.credentials.id;
      try {
        const user = await User.findById(id);
        const payload = request.payload;

        let time = payload.time;

        let hours = time.slice(0,2);
        let minutes = time.slice(3);
        let display_time = hours + "hrs " + minutes + " mins"


        const newTrail = new Trail({
          creator: user._id,
          county: payload.county,
          trailname: payload.trailname,
          trailtype: payload.trailtype,
          traillength: payload.traillength,
          grade: payload.grade,
          time: display_time,
          nearesttown: payload.nearesttown,
          description: payload.description,
          startcoordinates: {
            latitude: payload.startlat,
            longitude: payload.startlong,
          },
          endcoordinates: {
            latitude: payload.endlat,
            longitude: payload.endlong
          }
        });
        await newTrail.save();
        return h.redirect('/home');
      } catch (err) {
        return h.view('addPOI', { errors: [{ message: err.message }] });

      }
    }
  },
  deleteTrail: {
    handler: async function(request, h) {
      try {
        const trailID = request.params.id;

        await Trail.findOneAndDelete( { _id : trailID });

        return h.redirect('/home');
      } catch (err) {
      return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  }
};

module.exports = Walkways;