'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Cloudinary = require('cloudinary').v2;
const Joi = require('@hapi/joi');

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
    validate: {
      payload: {
        county: Joi.string().required(),
        trailname: Joi.string().required(),
        trailtype: Joi.string().required(),
        traillength: Joi.number().required(),
        grade: Joi.array().items(Joi.string()).single().required(),
        time: Joi.string().required(),
        nearesttown: Joi.string(),
        description: Joi.string(),
        startlat: Joi.number().precision(6).required() ,
        startlong: Joi.number().precision(6).negative().required(),
        endlat: Joi.number().precision(6) ,
        endlong: Joi.number().precision(6).negative()
        },
      options: {
        abortEarly: false
      },
      failAction: async function(request, h, error) {
        return h
          .view('addPOI', {
            title: 'Add POI Error',
            errors: error.details,
          })
          .takeover()
          .code(400);
      }
    },
      handler: async function(request, h) {

        const id = request.auth.credentials.id;
        try {
          const user = await User.findById(id);
          const payload = request.payload;

          let name = payload.trailname;
          const checkName = await Trail.find({ trailname: name, creator: id });

          if (checkName.length >= 1) {
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

        console.log(user);

        const trailID = request.params.id;
        let trail = await Trail.find( { _id : trailID }).lean();
        console.log("This is the current Trail : ", trail);
        let current_trail = trail[0];
        console.log("This is the ONLY Trail : ", current_trail);


        return h.view('viewPOI', { title: "Walkway POI" , trail: current_trail, user: user} );
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

        return h.view('editPOI', { title: "Edit POI" + trail.trailname , trail: trail , user: user} );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  updateTrail: {
    validate: {
      payload: {
        county: Joi.string().required(),
        trailname: Joi.string().required(),
        trailtype: Joi.string().required(),
        traillength: Joi.number().required(),
        grade: Joi.array().items(Joi.string()).single().required(),
        time: Joi.string().required(),
        nearesttown: Joi.string(),
        description: Joi.string(),
        startlat: Joi.number().precision(6).required() ,
        startlong: Joi.number().precision(6).negative().required(),
        endlat: Joi.number().precision(6) ,
        endlong: Joi.number().precision(6).negative()
      },
      options: {
        abortEarly: false
      },
      failAction: async function(request, h, error) {
        const trailID = request.params.id;
        let trail = await Trail.find( { _id : trailID }).lean();
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        return h
          .view('editPOI', {
            title: 'Edit POI Error',
            errors: error.details,
            trail: trail,
            user: user
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {
      try {
        const trailID = request.params.id;
        let trails = await Trail.find( { _id : trailID });
        let trail = trails[0];
        console.log("Trail to Edit is : ", trail);

        const trailEdit = request.payload;

        trail.county = trailEdit.county;
        trail.trailname = trailEdit.trailname;
        trail.trailtype = trailEdit.trailtype;
        trail.traillength = trailEdit.traillength;
        trail.grade = trailEdit.grade;
        trail.time = trailEdit.time;
        trail.nearesttown = trailEdit.nearesttown;
        trail.description = trailEdit.description;
        trail.startlat = trailEdit.startlat;
        trail.startlong = trailEdit.startlong;
        trail.endlat = trailEdit.endlat;
        trail.endlong = trailEdit.endlong;

        await trail.save();
        return h.redirect('/home');

      } catch (err) {
          return h.view('editPOI', { errors: [{ message: err.message }] });
      }
    }
  }
};

module.exports = Walkways;