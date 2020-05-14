'use strict';

const ImageStore = require('./app/utils/image-store');
const Hapi = require('@hapi/hapi');
const fs = require('fs');

require('./app/models/db');

const server = Hapi.server({
  port: 3000,
  host: 'localhost'
});

const secure_server= Hapi.server(
  {
    port: 3443,
    tls: {
      key: fs.readFileSync('keys/private/webserver.key'),
      cert: fs.readFileSync('keys/webserver.crt')
    },
    host: 'localhost'
  }
)

const dotenv = require('dotenv');

const credentials = {
  cloud_name: process.env.name,
  api_key: process.env.key,
  api_secret: process.env.secret
};

const result = dotenv.config();
if (result.error) {
  console.log(result.error.message);
  process.exit(1);
}

async function init() {
  await server.register(require('@hapi/inert'));
  await server.register(require('@hapi/vision'));
  await server.register(require('@hapi/cookie'));
  await server.register(require('@hapi/bell'));

  server.validator(require('@hapi/joi'));

  await secure_server.register(require('@hapi/inert'));
  await secure_server.register(require('@hapi/vision'));
  await secure_server.register(require('@hapi/cookie'));

  secure_server.validator(require('@hapi/joi'));

  ImageStore.configure(credentials);

  server.views({
    engines: {
      hbs: require('handlebars'),
    },
    relativeTo: __dirname,
    path: './app/views',
    layoutPath: './app/views/layouts',
    partialsPath: './app/views/partials',
    layout: true,
    isCached: false,
  });

  secure_server.views({
    engines: {
      hbs: require('handlebars'),
    },
    relativeTo: __dirname,
    path: './app/views',
    layoutPath: './app/views/layouts',
    partialsPath: './app/views/partials',
    layout: true,
    isCached: false,
  });

  server.auth.strategy('cookie-auth', 'cookie', {
    cookie: {
      name: process.env.cookie_name,
      password: process.env.cookie_password,
      isSecure: false
    },
    redirectTo: '/',
  });

  secure_server.auth.strategy('session', 'cookie', {
    cookie: {
      name: process.env.cookie_name,
      password: process.env.cookie_password,
      isSecure: false
    },
    redirectTo: '/',
  });

  const bellAuthOptions = {
    provider: 'github',
    password: 'github-encryption-password-secure', // String used to encrypt cookie
    // used during authorisation steps only
    clientId: process.env.git_id,          // *** Replace with your app Client Id ****
    clientSecret: process.env.git_client_secret,  // *** Replace with your app Client Secret ***
    isSecure: false        // Should be 'true' in production software (requires HTTPS)
  };

  server.auth.strategy('github-oauth', 'bell', bellAuthOptions);

  server.auth.default('cookie-auth');
  //server.auth.default('session');
  secure_server.auth.default('session');

  server.route(require('./routes'));
  server.route(require('./routes-api'));

  secure_server.route(require('./routes'));
  secure_server.route(require('./routes-api'));

  await server.start();
  await secure_server.start();
  console.log(`Server running at: ${server.info.uri}`);
  console.log(`Server running at: ${secure_server.info.uri}`);

}

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

init();