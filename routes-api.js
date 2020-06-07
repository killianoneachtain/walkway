'use strict';

const Trails = require('./app/api/trails');
const Users = require('./app/api/users');
const Events = require('./app/api/events');

module.exports = [
  { method: 'GET', path: '/api/trails', config: Trails.find },
  { method: 'GET', path: '/api/trails/{id}', config: Trails.findOne },
  { method: 'POST', path: '/api/trails', config: Trails.create },
  { method: 'DELETE', path: '/api/trails/{id}', config: Trails.deleteOne },
  { method: 'DELETE', path: '/api/trails', config: Trails.deleteAll },

  { method: 'GET', path: '/api/users', config: Users.find },
  { method: 'GET', path: '/api/users/{id}', config: Users.findOne },
  { method: 'POST', path: '/api/users', config: Users.create },
  { method: 'DELETE', path: '/api/users/{id}', config: Users.deleteOne },
  { method: 'DELETE', path: '/api/users', config: Users.deleteAll },

  { method: 'POST', path: '/api/users/authenticate', config: Users.authenticate },

  { method: 'GET', path: '/api/events', config: Events.find },
  { method: 'GET', path: '/api/events/{id}', config: Events.findOne },
  { method: 'GET', path: '/api/events/creator/{userID}', config: Events.findByCreator },
  { method: 'GET', path: '/api/events/category/{category}', config: Events.findByCategory },
  { method: 'GET', path: '/api/events/time/{time}', config: Events.findByTime },
  { method: 'POST', path: '/api/events', config: Events.create },
  { method: 'DELETE', path: '/api/events/{id}', config: Events.deleteOne },
  { method: 'DELETE', path: '/api/events', config: Events.deleteAll },
];