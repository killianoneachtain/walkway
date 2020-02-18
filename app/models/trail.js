'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');


const trailSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
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

trailSchema.statics.findByID = function(id) {
  return this.findOne({ _id : id});
};

trailSchema.statics.findByCreator = function(id) {
  return this.find({ creator : id});
};


module.exports = Mongoose.model('Trail', trailSchema);