const Walkways = require('./app/controllers/walkways');

module.exports = [
  { method: 'GET', path: '/', config: Walkways.index },
  { method: 'GET', path: '/signup', config: Walkways.signup },
  { method: 'GET', path: '/login', config: Walkways.login },
  {
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './public'
      }
    }
  }
];