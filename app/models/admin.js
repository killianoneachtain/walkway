'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');
const bCrypt = require('bcrypt');

const adminSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String
});

adminSchema.statics.findByEmail = function(email) {
  return this.findOne({ email : email});
};

adminSchema.methods.comparePassword = async function(candidatePassword) {
  const isMatch = await bCrypt.compare(candidatePassword, this.password);
  if (!isMatch) {
    throw Boom.unauthorized('Password does not match our records.');
  }
  return isMatch;
};

module.exports = Mongoose.model('Admin', adminSchema);