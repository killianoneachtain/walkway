'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const CategorySchema = new Schema({
  title: String,
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
});

CategorySchema.statics.findByID = function(id) {
  return this.findOne({ _id : id});
};

CategorySchema.statics.findByCreator = function(id) {
  return this.find({ creator : id});
};

CategorySchema.statics.findByName = function(name) {
  return this.find({ trailTypename : name });
}

module.exports = Mongoose.model('Category', CategorySchema);