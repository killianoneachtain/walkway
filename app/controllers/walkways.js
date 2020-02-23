'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Cloudinary = require('cloudinary').v2;

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

        let user_id = user._id;
        console.log("Current ID is : ", user_id);

        let name = payload.trailname;
        const checkName = await Trail.find( { trailname: name, creator: id } );

        console.log("checkName is : ", checkName);

        //let first_creator = checkName[0].creator;
        //console.log("First creator ia : ",first_creator);

        if (checkName.length >= 1)
          {
            const message = 'Please choose a different Trail Name. "' + name + '" is already in use.';
            throw Boom.notAcceptable(message);
          }

        const newTrail = new Trail({
          creator: user._id,
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
  },
  viewTrail: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        const trailID = request.params.id;
        const trail = await Trail.find( { _id : trailID }).lean();
        console.log("This is the current Trail : ", trail);

        return h.view('viewPOI', { title: "Walkway POI" , trail: trail, user: user} );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  showTrail: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        const trailID = request.params.id;
        const trail = await Trail.find( { _id : trailID }).lean();
        console.log("This is the current Trail : ", trail);

        return h.view('editPOI', { title: "Edit POI" + trail.trailname , trail: trail, user: user} );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  updateTrail: {
    handler: async function(request, h) {
      try {
        const trailEdit = request.params.id;
        console.log("Trail to Edit is : ", trailEdit);

        return h.redirect('/home');

      } catch (err) {
          return h.view('editPOI', { errors: [{ message: err.message }] });
      }
    }
  }
};

module.exports = Walkways;