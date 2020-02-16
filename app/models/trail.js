'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');


const trailSchema = new Schema({
  county: String,
  trailname: String,
  trailtype: String,
  traillength: Number,
  grade: Array,
  time: String,
  nearesttown: String,
  description: String,
  startcoordinates: {
    latitude: {
      type: Number,
      minimum: 51.000000,
      maximum: 56.000000
    },
    longitude: {
      type: Number,
      minimum: -10.00000,
      maximum: -5.00000
    }
  },
    endcoordinates: {
      latitude:{
        type: Number,
        minimum: 51.000000,
        maximum: 56.000000
      },
      longitude: {
        type: Number,
        minimum: -10.000000,
        maximum: -5.000000
      }
  }
});

trailSchema.statics.findByType = function(type) {
  return this.findOne({ type : type});
};

module.exports = Mongoose.model('Trail', trailSchema);