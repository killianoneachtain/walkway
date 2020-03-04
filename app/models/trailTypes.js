'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const trailTypeSchema = new Schema({
  title: String,
  variable: String,
  identifier: String,
  pois: {
    type: Schema.Types.ObjectId,
    ref: 'Trail'
  }
});

trailTypeSchema.statics.findByID = function(id) {
  return this.findOne({ _id : id});
};

trailTypeSchema.statics.findByCreator = function(id) {
  return this.find({ creator : id});
};

trailTypeSchema.statics.findByName = function(name) {
  return this.find({ trailTypename : name });
}

module.exports = Mongoose.model('TrailType', trailTypeSchema);