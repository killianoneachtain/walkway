'use strict';

const User = require('../models/user');
const Admin = require('../models/admin');
const Trail = require('../models/trail');
const Events = require('../models/events');
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
  acceptFriend: {
    handler: async function(request,h) {
      try {

        const userId = request.auth.credentials.id;
        let currentUser = await User.findById(userId).lean();

        let friend = await User.findById(request.params.friendID).lean();
        let friendID = friend._id;

        let areFriends = '';
        let friends = currentUser.friends;
        //console.log("Friends are : ", friends);
        areFriends = friends.includes(friendID);
        //console.log("Friends status is :", areFriends);

        try {
          // 1. remove friend id from requestsSent array
          // 2. move to friend list
          // 3. remove userId from friendRequests array

          try {
            //console.log("friendID is :", friendID);
            //console.log("UserId is : ", userId);
            let user = await User.find( { _id : userId });
            //console.log("THE USER IS:", user);

            await User.updateOne({ _id: userId }, { $pull: { friendRequests: friendID } }).lean();

            user = await User.find( { _id : userId });
            //console.log("THE USER AFTER friendRequests UPDATE IS:", user);

            let currentUser = user[0];
            await currentUser.save;
          } catch (err) {
            console.log(err);
          }

          try {
            console.log("friendID is :", friendID);
            console.log("UserId is : ", userId);

            let user = await User.find( { _id : userId });
            let Friend = await User.find( { _id : friendID });

            //let addToFriends = User.addToFriends(userId, friendID);
            await User.updateOne({ _id: userId }, { $push: { friends: friendID } });
            await User.updateOne({ _id: friendID}, { $push: { friends: userId } } );

            let currentUser = user[0];
            await currentUser.save;
            let thisFriend = Friend[0];
            await thisFriend.save;
            //console.log("Friends Added to both people:", addToFriends);
          } catch (err)
          {
            console.log(err)
          }

          try {

            await User.updateOne({ _id: friendID }, { $pull: { requestsSent: userId } });
            let user = await User.find( { _id : friendID });
            let currentUser = user[0];
            await currentUser.save;
          } catch (err) {
            console.log(err);
          }
        } catch (err) {
          console.log(err);
        }

        //updated friend list

        //console.log("Friends are : ", friendsList);

        currentUser = await User.findById(userId).lean();
        let requestsList = currentUser.friendRequests; //Updated friendRequests;
        friends = currentUser.friends;
        let friendsList=[];
        for (let i=0;i < friends.length;i++)
        {
          friendsList.push(await User.findById(friends[i]).lean());
        }

        //console.log("Requests are : ", requestsList);

        // Create an Event here to say Users have become friends
        let now = new Date();
        let here = now.getTime();

        let signUpCard = "<div class=\"ui fluid card\">\n" +
          "  <div class=\"content\">\n" +
          "    <div class=\"header\">New Friendship</div>\n" +
          "    <div class=\"description\">\n" +
          "      <p>" + currentUser.firstName + ' ' + currentUser.lastName + " and " + friend.firstName + " " + friend.lastName + " are now Friends. </p>\n" +
          "    </div>\n" +
          "  </div>\n" +
          "  <div class=\"extra content\">\n" +
          "    <div class=\"author\">\n" +
          "      <i class=\"big user icon\"></i>" + currentUser.firstName + " " + currentUser.lastName + "\n" +
          "    </div>\n" +
          "  </div>\n" +
          "</div>";

        //console.log("SignUp card is", signUpCard);

        const newEvent = new Events({
          creator: currentUser.id,
          eventTime: here,
          category: "friends",
          event: signUpCard
        });
        const event = await newEvent.save();


        return h.view('friends', {friends: friendsList, user: currentUser, friendRequests: requestsList});
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

        let pending = user.requestsSent;
        let pendingList=[];
        for (let i=0;i < pending.length;i++)
        {
          pendingList.push(await User.findById(pending[i]).lean());
        }
        console.log("Pending are : ", pendingList);

        return h.view('friends', {title: 'My Friends', friends: friendsList, user: user, friendRequests: requestsList,
        friendsPending: pendingList});
      } catch (err) {
        return h.view('home');
      }
    }
  },
  denyFriend: {
    handler: async function(request,h) {
      try {
        const userId = request.auth.credentials.id;
        //let currentUser = await User.findById(userId).lean();

        let friend = await User.findById(request.params.friendID).lean();
        let friendID = friend._id;
        //console.log("friendID is :", friendID);
        //console.log("UserId is : ", userId);

        // 1. Remove friendID from pending list
        // 2. Remove userID from friend requestSent list

        try {
          try{
            try {
                await User.updateOne({ _id: userId }, { $pull: { friendRequests: friendID } }).lean();
              } catch(err) {
                console.log(err);
              }

              let user = await User.find( { _id : userId });
              //console.log("THE USER AFTER friendRequests UPDATE IS:", user);
              let currentUser = user[0];
              await currentUser.save;
            } catch (err) {
                console.log(err);
              }

          try {
            await User.updateOne({ _id: friendID }, { $pull: { requestsSent: userId } });
            let user = await User.find( { _id : friendID });
            let currentUser = user[0];
            await currentUser.save;
          } catch (err) {
              console.log(err);
            }
        } catch (err) {
          console.log(err);
        }

        //updated friend list

        //console.log("Friends are : ", friendsList);

        let currentUser = await User.findById(userId).lean();
        let requestsList = currentUser.friendRequests; //Updated friendRequests;
        let friends = currentUser.friends;
        let friendsList=[];
        for (let i=0;i < friends.length;i++)
        {
          friendsList.push(await User.findById(friends[i]).lean());
        }

        console.log("Requests are : ", requestsList);

        return h.view('friends', {friends: friendsList, user: currentUser, friendRequests: requestsList});
      }
      catch (err) {
        return h.view('main', { errors: [{ message: err.message }] });
      }
    }
  },
  allUsers: {
    handler:  async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        const allUsers = await User.find( { $and: [ { type: { $eq: "user" } }, { _id: { $ne: id } } ] } ).lean();
        console.log("All Users are:", allUsers);

        let friends = user.friends;
        //console.log("Friends are : ", friends);
        let friendsList=[];
        for (let i=0;i < friends.length;i++)
        {
          friendsList.push(await User.findById(friends[i]).lean());
        }

        let requests = user.friendRequests;
        let requestsList=[];
        for (let i=0;i < requests.length;i++)
        {
          requestsList.push(await User.findById(requests[i]).lean());
        }
        console.log("Requests are : ", requestsList);

        let pending = user.requestsSent;
        let pendingList=[];
        for (let i=0;i < pending.length;i++)
        {
          pendingList.push(await User.findById(pending[i]).lean());
        }
        console.log("Pending are : ", pendingList);

        return h.view('allUsers',{title: 'Search for Friends', currentUser: user, user: user,
          friends: friendsList, friendRequests: requestsList, friendsPending: pendingList,
          allUsers: allUsers } )

      } catch(err) {
        console.log(err)
      }
      }
    },
  myNews:{
    handler:  async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        // create an array with all events from my friends
        //order by time newest first to oldest last
        // limit the amount of news items to 50;

        let friendEvents = await Events.find().lean();

        return h.view('myNews', {title: 'My News', user: user, friendEvents: friendEvents })

      } catch(err)
      {
        console.log(err);
      }
    }

  }
};

module.exports = Social;