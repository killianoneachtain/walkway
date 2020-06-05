'use strict';

const User = require('../models/user');
const Admin = require('../models/admin');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const bCrypt = require('bcrypt');           // ADDED week9
const saltRounds = 10;                      // ADDED week9
const Bell = require('@hapi/bell');
const AuthCookie = require('@hapi/cookie');

const Accounts = {
  index: {
    auth: false,
    handler: function(request, h) {
      return h.view('main', { title: 'Welcome to Walkways' });
    }
  },
  showSignup: {
    auth: false,
    handler: function(request, h) {
      return h.view('signup', { title: 'Sign up for Walkways' });
    }
  },
  signup: {
    auth: false,
    validate: {
      payload: {
        firstName: Joi.string()
          .alphanum()
          .min(2)
          .max(30)
          .regex(/^[A-Za-z-']{1,30}$/)
          .trim()
          .messages({ 'string.pattern.base': 'First Name must be between 2 and 30 characters' })
          .required(),
        lastName: Joi.string()
          .min(2)
          .max(30)
          .regex(/^[A-Za-z'-]{1,30}$/)
          .trim()
          .messages({ 'string.pattern.base': 'Last Name must be between 2 and 30 characters' })
          .required(),
        email: Joi.string()
          .email()
          .required(),
        new_password: Joi.string()
          .min(8)
          .max(15)
          .regex(/^(?=.*[0-9])(?=.*[!@#$^&*])[a-zA-Z0-9!@#$^&*]{8,15}$/)
          .messages({
            'string.pattern.base': '8 - 15 character PASSWORD must contain numbers, upper, lower and special characters.  '
          })
          .required(),
        confirm_password: Joi.ref('new_password')
      },
      options: {
        abortEarly: false
      },
      failAction: function(request, h, error) {

        // Returning of field values and field error code from :
        // https://livebook.manning.com/book/hapi-js-in-action/chapter-6/215

        const errorz = {};
        const details = error.details;

        for (let i=0; i < details.length; ++i){
          if (!errorz.hasOwnProperty(details[i].path)) {
            errorz[details[i].path] = details[i].message;
          }
        }
        //console.log("THE DETAILS ARE : ",details);
        //console.log(" THE ERRORZ ARE : ", errorz);
        return h.view('signup', {
            title: 'Sign up error',
            errors: error.details,
            values: request.payload,
            errorz: errorz
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {
      try {
        const payload = request.payload;
        let user = await User.findByEmail(payload.email);
        let admin = await Admin.findByEmail(payload.email);

        if ((user) || (admin)) {
          const message = 'Email address is already registered';
          throw Boom.badData(message);
        }

        if ((payload.new_password !== payload.confirm_password))
        {
          const message = 'Passwords do NOT match!';
          throw Boom.badData(message);
        }

        const hash = await bCrypt.hash(payload.new_password, saltRounds);    // ADDED


        let m = new Date();
        let joinDate =
          m.getUTCFullYear() + "/" +
          ("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
          ("0" + m.getUTCDate()).slice(-2);

        //console.log(joinDate);

        const newUser = new User({
          firstName: payload.firstName.replace(/^./, payload.firstName[0].toUpperCase()),
          lastName: payload.lastName.replace(/^./, payload.lastName[0].toUpperCase()),
          email: payload.email,
          password: hash,
          type: "user",
          profilePicture: "",
          profilePID: "",
          profileImages: [],
          friends: [],
          friendRequests: [],
          requestsSent: [],
          dateJoined: joinDate,
          online: false
        });
        user = await newUser.save();
        request.cookieAuth.set({ id: user.id });
        await User.update( { _id: user.id }, { "$set": { "online": true } } );
        return h.redirect('/home');
      } catch (err) {
        return h.view('signup', { errors: [{ message: err.message }] });
      }
    }
  },
  showLogin: {
    auth: false,
    handler: function(request, h) {
      return h.view('login', { title: 'Login to Walkways' });
    }
  },
  login: {
    auth: false,
    validate: {
      payload: {
        email: Joi.string()
          .email()
          .required(),
        password: Joi.string().required()
      },
      options: {
        abortEarly: false
      },
      failAction: function(request, h, error) {
        return h
          .view('login', {
            title: 'Sign in error',
            errors: error.details
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {
      const { email, password } = request.payload;
      try {

        let user = await User.findByEmail(email);

        let user_email=user.email;

        if ((user) && (user.type === "admin"))
        {
          await user.comparePassword(password);
          request.cookieAuth.set({ id: user.id });
          await User.updateOne( { _id: user.id }, { "$set": { "online": true } } );
          return h.redirect('/admin');
        } else if (user) {
          if (!await user.comparePassword(password)) {         // EDITED (next few lines)
            const message = 'Password does not match our records.';
            throw Boom.unauthorized(message);
          } else {
            request.cookieAuth.set({ id: user.id });
            await User.updateOne( { _id: user.id }, { "$set": { "online": true } } );
            return h.redirect('/home');
          }                                                    // END
        }

        else if (!user)
        {
          try {
            //console.log(email);
            let admin = await Admin.findByEmail(email);
            //console.log("Here in Admin : ", Admin.findByEmail(email));

            if (admin)
            {
              await user.comparePassword(password);
              request.cookieAuth.set({ id: admin.id });
              return h.redirect('/admin');
            }
          } catch (err) {
            return h.view('login', { errors: [{ message: err.message }] });
          }
          const message = 'Email address is not registered';
          throw Boom.unauthorized(message);
        }

      } catch (err) {
        return h.view('login', { errors: [{ message: err.message }] });
      }
    }
  },
  github_login: {
    auth: 'github-oauth',
    handler: function (request, h) {
      if (request.auth.isAuthenticated) {
        request.cookieAuth.set(request.auth.credentials);
        return ('Hello ' + request.auth.credentials.profile.displayName);
      }
      return('Not logged in...');
    }
  },
  logout: {
    //auth: false,
    handler: async function(request, h) {
      let userId = request.auth.credentials.id;
      await User.updateOne( { _id: userId }, { "$set": { "online": false } } );
      request.cookieAuth.clear();
      return h.redirect('/');
    }
  },
  showSettings: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;

        const user = await User.findById(id).lean();
        if (!user) {
          throw Boom.unauthorized();
        }

        if (user.type === "user")
        {
          return h.view('settings', { title: 'Walkway Settings', user: user });
        }

        if (user.type === "admin")
        {
          return h.view('adminsettings', { title: 'Walkway Adminstrator Settings', user: user });
        }

      } catch (err) {
        return h.view('login', { errors: [{ message: err.message }] });
      }
    }
  },
  updateSettings: {
    validate: {
      payload: {
        firstName: Joi.string()
          .alphanum()
          .min(2)
          .max(30)
          .regex(/^[A-Za-z-']{1,30}$/)
          .trim()
          .messages({ 'string.pattern.base': 'First Name must be between 2 and 30 characters' })
          .required(),
        lastName: Joi.string()
          .min(2)
          .max(30)
          .regex(/^[A-Za-z'-]{1,30}$/)
          .trim()
          .messages({ 'string.pattern.base': 'Last Name must be between 2 and 30 characters' })
          .required(),
        email: Joi.string()
          .email()
          .required(),
        new_password: Joi.string()
          .min(8)
          .max(15)
          .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/)
          .messages({
            'string.pattern.base': '8 - 15 character PASSWORD must contain numbers, upper, lower and special characters.  '
          })
          .required(),
        confirm_password: Joi.ref('new_password')
      },
      options: {
        abortEarly: false
      },
      failAction: function(request, h, error) {
        const errorz = {};
        const details = error.details;

        for (let i=0; i < details.length; ++i){
          if (!errorz.hasOwnProperty(details[i].path)) {
            errorz[details[i].path] = details[i].message;
          }
        }

        return h
          .view('settings', {
            title: 'Update error',
            errors: error.details,
            values: request.payload,
            errorz: errorz
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {
      try {
        const userEdit = request.payload;
        //console.log("Request. auth is : ", request.auth);
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        if (!user) {
          throw Boom.unauthorized();
        }

        const hash = await bCrypt.hash(userEdit.new_password, saltRounds);    // ADDED
        //const emailHash = await bCrypt.hash(userEdit.email, saltRounds);    // ADDED

        user.firstName = userEdit.firstName.replace(/^./, userEdit.firstName[0].toUpperCase()),
        user.lastName = userEdit.lastName.replace(/^./, userEdit.lastName[0].toUpperCase()),
        user.email = userEdit.email;
        user.password = hash;
        await user.save();
        return h.redirect('/settings');
      } catch (err) {
        return h.view('settings', { errors: [{ message: err.message }] });
      }
    }
  }
};

module.exports = Accounts;