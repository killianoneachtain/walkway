'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const CategorySchema = new Schema({
  title: {
    type: String,
    trim: true,
    required: true
  }
});

CategorySchema.statics.findByID = function(id) {
  return this.findOne({ _id : id});
};

CategorySchema.statics.findByTitle = function(title) {
  return this.find({ title : title});
};

CategorySchema.statics.findByMemberID = function(id)
{
  return this.find( { members: { $elemMatch: id } } );
};

module.exports = Mongoose.model('Category', CategorySchema);