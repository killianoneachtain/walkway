'use strict';

const Accounts = require('./app/controllers/accounts');
const Walkways = require('./app/controllers/walkways');

module.exports = [
  { method: 'GET', path: '/', config: Accounts.index },
  { method: 'GET', path: '/signup', config: Accounts.showSignup },
  { method: 'GET', path: '/login', config: Accounts.showLogin },
  { method: 'GET', path: '/logout', config: Accounts.logout },

  { method: 'POST', path: '/signup', config: Accounts.signup },
  { method: 'POST', path: '/login', config: Accounts.login },

  { method: 'GET', path: '/home', config: Walkways.home },
  { method: 'GET', path: '/admin', config: Walkways.admin },

  { method: 'GET', path: '/settings', config: Accounts.showSettings },
  { method: 'GET', path: '/adminsettings', config: Accounts.showSettings },

  { method: 'POST', path: '/adminsettings', config: Accounts.updateSettings },
  { method: 'POST', path: '/settings', config: Accounts.updateSettings },

  { method: 'GET', path: '/addPOI', config: Walkways.trailform },
  { method: 'POST', path: '/addPOI', config: Walkways.addtrail },

  { method: 'GET', path: '/deleteTrail/{id}', config: Walkways.deleteTrail },

  { method: 'GET', path: '/viewPOI/{id}', config: Walkways.viewTrail },



  {
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './public'
      }
    },
    options: { auth: false }
  }
];