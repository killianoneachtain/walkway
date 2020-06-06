'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
//const Boom = require('@hapi/boom');


const eventSchema = new Schema({
  creator: {
      type: Schema.Types.ObjectId,
        ref: 'User'
  },
  //creatorName: String,
  eventTime: Date,
  category: String,
  event: String //HTML Code of the event
});

eventSchema.statics.findById = function(id) {
  return this.findOne({ _id : id});
};

eventSchema.statics.findByCreator = function(id)
{
  return this.find({ creator: id});
};

eventSchema.statics.findByTime = function(time)
{
  return this.find( { eventTime: time} );
};

/*eventSchema.methods.newUserEvent = function(id)
{
  this.update(
    { _id:1 },
    {
      $push: {
          creator: id
      }
    }
  )
}*/


module.exports = Mongoose.model('Events', eventSchema);