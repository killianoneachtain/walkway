'use strict';
const Event = require('../models/events');
const Boom = require('@hapi/boom');

const Events = {
  find: {
    auth: false,
    handler: async function(request, h) {
      const events = await Event.find();
      return events;
    }
  },
  findOne: {
    auth: false,
    handler: async function(request, h) {
      try {
        const event = await Event.findOne({ _id: request.params.id });
        if (!event) {
          return Boom.notFound('No Event with this id');
        }
        return event;
      } catch (err) {
        return Boom.notFound('No Event with this id');
      }
    }
  },
  findByCategory: {
    auth: false,
    handler: async function(request, h) {
      try {
        const event = await Event.find({ category : request.params.category });
        if (!event) {
          return Boom.notFound('No Event with this Category');
        }
        return event;
      } catch (err) {
        return Boom.notFound('No Event with this Category');
      }
    }
  },
  findByCreator: {
    auth: false,
    handler: async function(request, h) {
      try {
        const event = await Event.find({ creator : request.params.userID });
        if (!event) {
          return Boom.notFound('No Event with this creator');
        }
        return event;
      } catch (err) {
        return Boom.notFound('No Event with this creator');
      }
    }
  },
  findByTime: {
    auth:false,
    handler: async function(request,h) {
      try {
        const event = await Event.find({ eventTime: request.params.time });
        if (!event) {
          return Boom.notFound('No Event with this time');
        }
        return event;
      } catch (err) {
        return Boom.notFound( 'No event with this time');
      }
    }
  },
  create: {
    auth: false,
    handler: async function(request, h) {
      const newEvent = new Event(request.payload);
      const event = await newEvent.save();
      if (event) {
        return h.response(event).code(201);
      }
      return Boom.badImplementation('error creating event');
    }
  },
  deleteAll: {
    auth: false,
    handler: async function(request, h) {
      await Event.deleteMany({});
      return { success: true };
    }
  },
  deleteOne: {
    auth: false,
    handler: async function(request, h) {
      const response = await Event.deleteOne({ _id: request.params.id });
      if (response.deletedCount === 1) {
        return { success: true };
      }
      return Boom.notFound('id not found');
    }
  }
};

module.exports = Events;