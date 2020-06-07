'use strict';
const Events = require('../models/events');
const Boom = require('@hapi/boom');

const Events = {
  find: {
    auth: false,
    handler: async function(request, h) {
      const events = await Events.find();
      return events;
    }
  },
};

module.exports = Events;