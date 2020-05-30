'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');
const bCrypt = require('bcrypt');          // ADDED


const userSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    required: true
  },
  lastName: {
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    trim: true,
    required: true
  },
  password: {
    type: String,
    trim: true,
    required: true
  },
  type: {
    type: String,
    trim: true,
    required: true
  },
  trailtypes:[ {
    type: String
  }],
  profilePicture: {
    type: String,
    trim: true
  }
});

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email : email});
};

userSchema.statics.findByID = function(id) {
  return this.findOne({ _id : id});
};

userSchema.statics.findByType = function(type) {
  return this.findOne({ type : type});
};

// noinspection JSValidateTypes
userSchema.methods.comparePassword = async function(candidatePassword) {
  const isMatch = await bCrypt.compare(candidatePassword, this.password);
  if (!isMatch) {
    throw Boom.unauthorized('Password does not match our records.');
  }
  return isMatch;
};


module.exports = Mongoose.model('User', userSchema);