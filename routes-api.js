'use strict';

const Trails = require('./app/api/trails');
const Users = require('./app/api/users');


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
];