'use strict';

const Trail = require('../models/trail');
const Boom = require('@hapi/boom');

const Trails = {
  find: {
    auth: false,
    handler: async function(request, h) {
      const trails = await Trail.find();
      return trails;
    }
  },
  findOne: {
    auth: false,
    handler: async function(request, h) {
      try {
        const trail = await Trail.findOne({ _id: request.params.id });
        if (!trail) {
          return Boom.notFound('No Trail with this id');
        }
        return trail;
      } catch (err) {
        return Boom.notFound('No Trail with this id');
      }
    }
  },
  create: {
    auth: false,
    handler: async function(request, h) {
      const newTrail = new Trail(request.payload);
      const trail = await newTrail.save();
      if (trail) {
        return h.response(trail).code(201);
      }
      return Boom.badImplementation('error creating trail');
    }
  },
  deleteAll: {
    auth: false,
    handler: async function(request, h) {
      await Trail.deleteMany({});
      return { success: true };
    }
  },
  deleteOne: {
    auth: false,
    handler: async function(request, h) {
      const response = await Trail.deleteOne({ _id: request.params.id });
      if (response.deletedCount === 1) {
        return { success: true };
      }
      return Boom.notFound('id not found');
    }
  }
};

module.exports = Trails;