'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');

const trailSchema = new Schema({
        creator: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        creatorName: String,
        county: String,
        trailname: String,
        trailtype: String,
        traillength: Number,
        grade: Array,
        time: String,
        nearesttown: String,
        description: String,
        startcoordinates:
        {
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
        },
        images: Array,
        profileImage: String,
        comments: Array
        /*{ The structure of the commenting system.
            comment: {
              content: String,
              postedBy: {
                userId: String,
                userName: String,
                profilePicture: String,
              },
              time: Date,
              likes: Number
              }
            },
        }*/
  });

trailSchema.statics.findByID = function(id) {
  return this.findOne({ _id : id});
};

trailSchema.statics.findByCreator = function(id) {
  return this.find({ creator : id});
};

trailSchema.statics.findByName = function(name) {
  return this.find({ trailname : name });
}

trailSchema.statics.findByType = function(type) {
  return this.find({ trailtype : type });
}

trailSchema.methods.deleteUserComments = async function(id)
{
  return this.update( { } , { $pull : { comments: { _id: id } } }, { multi: true } );
}

trailSchema.statics.returnTrailTypes = function()
{

  let trails = this.find( { trailtype: { $ne : 'abc' } } );
  let trailTypers = [];

  return trails;
}

module.exports = Mongoose.model('Trail', trailSchema);