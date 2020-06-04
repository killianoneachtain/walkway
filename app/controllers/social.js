'use strict';

const User = require('../models/user');
const Admin = require('../models/admin');
const Trail = require('../models/trail');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');

const Social = {
  addFriend: {
    handler: async function(request,h) {
      try {
        console.log("HERE I AM TRYING TO ADD A FRIEND");
        const userId = request.auth.credentials.id;
        let currentUser = await User.findById(userId).lean();

        let friend = await User.findById(request.params.friendID).lean();
        let friendID = friend._id;
        friendID.toString();
        userId.toString();
        console.log("User ID is : ", userId);
        console.log("Friend ID is: ", friendID);

        try {
          let user = await User.find( { _id : userId });
          let currentUser = user[0];
          currentUser.requestsSent.push(friendID);
          await currentUser.save();
        } catch (err) {
          console.log(err);
        }
        try {
          let user = await User.find( { _id : friendID });
          let currentUser = user[0];
          currentUser.friendRequests.push(userId);
          await currentUser.save();
        } catch (err)
        {
          console.log(err);
        }

        const requestSent = true;

        //Search through currentUser Friends List to see if profiled user
        // is in their friend list.
        let areFriends = '';
        let friends = currentUser.friends;
        //console.log("Friends are : ", friends);
        areFriends = friends.includes(friendID);
        //console.log("Friends status is :", areFriends);

        let profiledUserName = friend.firstName + ' ' + friend.lastName;

        let walkways = await Trail.find( { creator: friend._id }).populate('trail').lean();

        let POI_total = walkways.length;

        let total_images = 0;

        for (let i =0; i < walkways.length; i++)
        {
          let imageNumber = walkways[i].images.length;
          total_images = total_images + imageNumber;
        }

        return h.view('viewProfile', { title: profiledUserName + ' Details', walkways: walkways,
          user: friend, currentUser: currentUser, areFriends: areFriends,
          POI_total: POI_total, total_images: total_images, requestSent: requestSent});
      }
      catch (err) {
        return h.view('main', { errors: [{ message: err.message }] });
      }
    }
  },
  friends: {
    handler:  async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        let friends = user.friends;
        //console.log("Friends are : ", friends);
        let friendsList=[];

        for (let i=0;i < friends.length;i++)
        {
          friendsList.push(await User.findById(friends[i]).lean());
        }
        //console.log("Friends are : ", friendsList);

        let requests = user.friendRequests;
        let requestsList=[];
        for (let i=0;i < requests.length;i++)
        {
          requestsList.push(await User.findById(requests[i]).lean());
        }
        console.log("Requests are : ", requestsList);

        return h.view('friends', {friends: friendsList, user: user, friendRequests: requestsList});
      } catch (err) {
        return h.view('home');
      }
    }
  }
};
module.exports = Social;