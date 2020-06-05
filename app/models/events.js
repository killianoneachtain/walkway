'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
//const Boom = require('@hapi/boom');


const eventSchema = new Schema({
  creator: {
      type: Schema.Types.ObjectId,
        ref: 'User'
  },
  creatorName: String,


});

eventSchema.statics.findById = function(id) {
  return this.findOne({ _id : id});
};


module.exports = Mongoose.model('Events', eventSchema);