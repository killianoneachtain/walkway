'use strict';

const Trail = require('../models/trail');
const User = require('../models/user');

const Walkways = {
  home: {
    handler: function(request, h) {
      return h.view('home', { title: 'Make a Review' });
    }
  },
  report: {
    handler: function(request, h) {
      return h.view('report', { title: 'Walkways so far' });
    }
  },
  admin: {
    handler: function(request, h) {
      return h.view('admin', { title: 'Administrator Home' });
    }
  },
  addtrail: {
    auth: false,
    handler: async function(request, h) {
      try {

        const payload = request.payload;

        const newTrail = new Trail({
          county: payload.county,
          trailname: payload.trailname,
          trailtype: payload.trailtype,
          traillength: payload.traillength,
          grade: payload.grade,
          time: payload.time,
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
        return h.redirect('/admin');
      } catch (err) {
        return h.view('signup', { errors: [{ message: err.message }] });

      }
    }
  },



};

module.exports = Walkways;