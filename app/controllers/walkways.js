'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Category = require('../models/category');
const Boom = require('@hapi/boom');
const ImageStore = require('../utils/image-store');
const cloudinary = require('cloudinary').v2;

const Joi = require('@hapi/joi');

const Walkways = {
  home: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();

      const types = await Trail.distinct( "trailtype" ).populate('type').lean();

      const walkways = await Trail.find( { creator: id }).populate('trail').lean();


      return h.view('home', { title: 'Welcome to Walkways', walkways: walkways, user: user, types: types });
    }
  },
  trailform: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const categories = await Category.find({ creator: id }).lean();
      console.log("Categories are : ", categories);

      return h.view('addPOI', { title: 'Add Trail to your Walkways', categories: categories });
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

          let type = payload.trailtype;
          const check_type = await Category.find({ title: type, creator: id });
          if (check_type.length === 0)
          {
            try {
              const newCategory = new Category({
                title: type,
                creator: id
              });
              await newCategory.save();
            } catch (err)
            {
              console.log(err);
            }
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
          return h.redirect('home');
        } catch (err) {
          return h.view('addPOI', { errors: [{ message: err.message }] });
        }
      }
  },
  deleteTrail: {
    handler: async function(request, h) {
      try {
        const trailID = request.params.id;
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const trail = await Trail.findById(trailID);
        console.log("The trail is :", trail);

        if (trail.images.length > 0) {
          for (let i = 0; i < trail.images.length; i++) {
            try {
              await ImageStore.deleteImage(trail.images[i]);
            } catch (err) {
              console.log(err);
            }
          }
          let folderToDelete = user._id + '/' + trail.trailname;
          console.log("Folder name:", folderToDelete);

          try {
            await cloudinary.api.delete_folder(folderToDelete, function(error, result) {
              console.log(result);
            });
          } catch (error)
          {
            console.log(error);
          }
        }

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
        let trail = await Trail.find( { _id : trailID }).lean();

        let current_trail = trail[0];

        let trail_name = current_trail.trailname;

        let userImages = await ImageStore.getUserImages(trailID);

        process.env.google_maps_API;

        return h.view('viewPOI', { title: trail_name + " Details" , trail: current_trail, user: user,
          google_API: process.env.google_maps_API, images: userImages } );
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

        return h.view('editPOI', { title: "Edit " + trail.trailname , trail: trail , user: user} );
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