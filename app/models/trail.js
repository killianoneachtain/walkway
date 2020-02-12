'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');


const trailSchema = new Schema({
  trailName: String,
  type: String,
  description: String,
  coordinates: {
    longitude:{
      type: Number,
      minimum: -180,
      maximum: 180
    },
    latitude:{
      type: Number,
      minimum: -90,
      maximum: 90
    }
  },


});

trailSchema.statics.findByType = function(type) {
  return this.findOne({ type : type});
};

module.exports = Mongoose.model('Trail', trailSchema);