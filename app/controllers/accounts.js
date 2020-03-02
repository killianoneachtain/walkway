'use strict';

const User = require('../models/user');
const Admin = require('../models/admin');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const Cloudinary = require('cloudinary').v2;



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
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string()
          .email()
          .required(),
        new_password: Joi.string()
          .min(8)
          .max(15)
          .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/)
          //.error((errors) => ('"Password" requires at least ONE special character.'))
          .required().required(),
        confirm_password: Joi.ref('new_password')
      },
      options: {
        abortEarly: false
      },
      failAction: function(request, h, error) {
        return h
          .view('signup', {
            title: 'Sign up error',
            errors: error.details
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

        if ((payload.new_password != payload.confirm_password))
        {
          const message = 'Passwords do NOT match!';
          throw Boom.badData(message);
        }

        const newUser = new User({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: payload.confirm_password,
          type: "user"
        });
        user = await newUser.save();
        request.cookieAuth.set({ id: user.id });
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

        if ((user) && (user.type == "admin"))
        {
          user.comparePassword(password);
          request.cookieAuth.set({ id: user.id });
          return h.redirect('/admin');
        } else if (user) {
          user.comparePassword(password);
          request.cookieAuth.set({ id: user.id });
          return h.redirect('/home');
        }

        else if (!user)
        {
          try {
            console.log(email);
            let admin = await Admin.findByEmail(email);
            console.log("Here in Admin : ", Admin.findByEmail(email));

            if (admin)
            {
              user.comparePassword(password);
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
  logout: {
    auth: false,
    handler: function(request, h) {
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

        if (user.type == "user")
        {
          return h.view('settings', { title: 'Walkway Settings', user: user });
        }

        if (user.type == "admin")
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
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
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
          .view('settings', {
            title: 'Update error',
            errors: error.details
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {
      try {
        const userEdit = request.payload;
        console.log("Request. auth is : ", request.auth);
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        if (!user) {
          throw Boom.unauthorized();
        }

        user.firstName = userEdit.firstName;
        user.lastName = userEdit.lastName;
        user.email = userEdit.email;
        user.password = userEdit.password;
        await user.save();
        return h.redirect('/settings');
      } catch (err) {
        return h.view('settings', { errors: [{ message: err.message }] });
      }
    }
  },
};

module.exports = Accounts;