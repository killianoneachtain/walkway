'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');

const commentSchema = new Schema({
  content: String,
  postedBy: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    profilePicture: String
  },
  time: String
});

module.exports = Mongoose.model('Comment', commentSchema);