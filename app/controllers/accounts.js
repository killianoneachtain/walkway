'use strict';

const User = require('../models/user');
const Admin = require('../models/admin');
const Boom = require('@hapi/boom');


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
    handler: async function(request, h) {
      try {
        const userEdit = request.payload;
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