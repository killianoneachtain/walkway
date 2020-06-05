'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Boom = require('@hapi/boom');
const bCrypt = require('bcrypt');          // ADDED


const userSchema = new Schema({
  friends: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  friendRequests : [{ type: Schema.Types.ObjectId, ref: 'User'}],
  requestsSent : [{ type: Schema.Types.ObjectId, ref: 'User'}],
  firstName: {
    type: String,
    trim: true,
    required: true
  },
  lastName: {
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    trim: true,
    required: true
  },
  password: {
    type: String,
    trim: true,
    required: true
  },
  type: {
    type: String,
    trim: true,
    required: true
  },
  trailtypes:[ {
    type: String,
    trim: true
  }],
  profilePicture: {
    type: String,
    trim: true
  },
  profilePID:
  {
    type: String,
    trim: true
  },
  profileImages: Array,
  dateJoined: Date,
  online: Boolean
});

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email : email});
};

userSchema.statics.findByID = function(id) {
  return this.findOne({ _id : id});
};

userSchema.statics.findInRequests = function(id, friendID) {
  return this.findOne( { $and: [ { _id: id }, { requestsSent: { friendID } } ] } );
}

userSchema.statics.findByType = function(type) {
  return this.findOne({ type : type});
};

/*userSchema.statics.save = function(id)
{
  return this.save(id);
}*/

userSchema.statics.addToFriends = function(id,friendID) {
  try {
      this.updateOne({ _id: id }, { $push: { friends: friendID } });
      this.updateOne({ _id: friendID}, { $push: { friends: id } } );
      this.save(id);
      this.save(friendID);
      return true;
  } catch (err)
  {
    return err;
  }
}



// noinspection JSValidateTypes
userSchema.methods.comparePassword = async function(candidatePassword) {
  const isMatch = await bCrypt.compare(candidatePassword, this.password);
  if (!isMatch) {
    throw Boom.unauthorized('Password does not match our records.');
  }
  return isMatch;
};


module.exports = Mongoose.model('User', userSchema);