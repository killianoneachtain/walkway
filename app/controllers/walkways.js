'use strict';

const User = require('../models/user');
const Trail = require('../models/trail');
const Comment = require('../models/comment');
const Events = require('../models/events');
const ImageStore = require('../utils/image-store');
const cloudinary = require('cloudinary').v2;
const Event = require('../models/events');

const googleMapsClient = require('@google/maps').createClient({
  key: process.env.google_maps_API
});
//const Mongoose = require('mongoose');
const Joi = require('@hapi/joi');

const Walkways = {
  home: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();

      const walkways = await Trail.find ( { creator: id } ).populate('walkways').lean();
      //console.log("walkways are : ", walkways);

      return h.view('home', { title: 'Welcome to Walkways', walkways: walkways, user: user,
        google_API: process.env.google_maps_API,});
    }
  },
  shareWalk: {
    handler: async function(request, h) {
      try {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();

      let trailID = request.params.id;
      console.log("The trail ID is :", trailID);
      let trail= await Trail.findOne( { _id: trailID}).lean();

      //let currentTrail=trail[0];
      console.log(trail);

      //Link to shared Trail in the route '/viewPOI/{id}/{trailId}'
      // <a href="/viewPOI/{{@root.user._id}}/{{_id}}">{{ trailname }}</a>

      let shareLink = "<a href=\"/viewPOI/" + trail._id + "\">" + trail.trailname + "</a>";
      console.log("the sharelink is:", shareLink);

      let now = new Date();
      let here = now.getTime();

      let profilePic = "";
      if (user.profilePicture === '') {
        profilePic = '/images/default_user.png';
      } else {
        profilePic = user.profilePicture;
      }

      let dateString = now.getUTCFullYear() + "/" +
        ("0" + (now.getUTCMonth() + 1)).slice(-2) + "/" +
        ("0" + now.getUTCDate()).slice(-2) + " " +
        ("0" + now.getUTCHours()).slice(-2) + ":" +
        ("0" + now.getUTCMinutes()).slice(-2) + ":" +
        ("0" + now.getUTCSeconds()).slice(-2);
      //console.log(dateString);

      let signUpCard = "<div class=\"ui fluid card\" style=\"background: #CCD0A9\">\n" +
        "  <div class=\"content\">\n" +
        "    <div class=\"header\">Shared something Interesting</div>\n" +
        "    <div class=\"meta\">" + dateString + "</div>\n" +
        "    <div class=\"description\">\n" +
        "      <p style=\"font-size: 140%\">" + user.firstName + ' ' + user.lastName + " found this would be interesting. </p>\n" +
        "      <p style=\"font-size: 140%\">Check out " + shareLink + " </p>\n" +
        "    </div>\n" +
        "  </div>\n" +
        "  <div class=\"extra content\">\n" +
        "    <div class=\"author\">\n" +
        "      <img class=\"ui avatar image\" src=\"" + profilePic + "\">" + user.firstName + " " + user.lastName + "\n" +
        "    </div>\n" +
        "  </div>\n" +
        "</div>";

      const newEvent = new Events({
        creator: user._id,
        eventTime: here,
        category: "friends",
        event: signUpCard
      });
      const event = await newEvent.save();

      return h.redirect('/myNews/' + user._id);
      } catch (err) {
        return h.view('main', { errors: [{ message: err.message }] });
        }
    }
  },
  trailform: {
    handler: async function(request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let categories = user.trailtypes;
      console.log("Categories are : ", categories);
      return h.view('addPOI', { title: 'Add Trail to your Walkways', categories: categories, user: user });
    }
  },
  addtrail: {
    validate: {
      payload: {
        county: Joi.string().trim().regex(/^[a-zA-Z -.,]{3,40}$/).valid('Antrim',
          'Armagh',
          'Carlow',
          'Cavan',
          'Clare',
          'Cork',
          'Derry',
          'Donegal',
          'Down',
          'Dublin',
          'Fermanagh',
          'Galway',
          'Kerry',
          'Kildare',
          'Kilkenny',
          'Laois',
          'Leitrim',
          'Limerick',
          'Longford',
          'Louth',
          'Mayo',
          'Meath',
          'Monaghan',
          'Offaly',
          'Roscommon',
          'Sligo',
          'Tipperary',
          'Tyrone',
          'Waterford',
          'Westmeath',
          'Wexford',
          'Wicklow').required(),
        trailname: Joi.string().trim().regex(/^[a-zA-Z0-9 ,-.]{3,40}$/).min(6).max(30).required(),
        trailtype: Joi.string().trim().regex(/^[a-zA-Z ]{3,40}$/).min(2).max(30).required(),
        traillength: Joi.number().min(0.5).max(600).required(),
        grade: Joi.array().items(Joi.string()).single().valid('Easy',
          'Moderate',
          'Strenuous',
          'Very Difficult',
          'Wheelchair and Buggy Accessible').required(),
        time: Joi.string().trim().regex(/^([0-9]{2})\:([0-9]{2})$/).required(),
        nearesttown: Joi.string().trim().regex(/^[a-zA-Z ,-.]{3,40}$/).max(30),
        description: Joi.string().trim().min(6).max(500).regex(/^[a-zA-Z0-9 ,-.]{6,500}$/)
          .messages({ 'string.pattern.base': 'Description must be between alphanumeric or "-,."' })
          .required(),
        startlat: Joi.number().precision(6).min(51.419956).max(55.313026).required(),
        startlong: Joi.number().precision(6).min(-10.669592).max(-5.485242).negative().required(),
        endlat: Joi.number().precision(6).min(51.419956).max(55.313026) ,
        endlong: Joi.number().precision(6).min(-10.669592).max(-5.485242).negative()
      },
      options: {
        abortEarly: false,
      },
      failAction: async function(request, h, error) {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        let categories = user.trailtypes;

        // Returning of field values and field error code from :
        // https://livebook.manning.com/book/hapi-js-in-action/chapter-6/215

        const errorz = {};
        const details = error.details;

        for (let i=0; i < details.length; ++i){
          if (!errorz.hasOwnProperty(details[i].path)) {
            errorz[details[i].path] = details[i].message;
          }
        }
        console.log("THE DETAILS ARE : ",details);

        let name = request.payload.trailname;
        console.log("NAME IS: ", name);
        name = name.replace(/ /g, '-');
        const checkName = await Trail.find({ trailname: name, creator: id });
        console.log("CheckName is : ", checkName);

        if (checkName.trailname === name) {
          errorz['trailname'] = 'Please choose a different Trail name. "' + name + '" is already in use.';
        }
        console.log(" THE ERRORZ ARE : ", errorz);
        return h
          .view('addPOI', {
            title: 'Add POI Error',
            errors: error.details,
            categories: categories,
            values: request.payload,
            errorz: errorz
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {

      const id = request.auth.credentials.id;
      try {
        const user = await User.findById(id);
        const payload = request.payload;

        let type = payload.trailtype;
        const checkType = await User.find( { trailtypes :  type  });
        console.log(checkType);

        if (checkType.length === 0)
        {
          await User.updateOne({_id: id}, { $push: { trailtypes: type } });
        }

        let name = request.payload.trailname;
        name = name.replace(/ /g, '-');
        console.log("NAME IS: ", name);

        let creatorName = user.firstName + ' ' + user.lastName;

        const checkName = await Trail.find({ trailname: name, creator: id });

        console.log("CheckName is : ", checkName);

        if (checkName.trailname === name) {

        }
        const newTrail = new Trail({
          creator: user._id,
          creatorName: creatorName,
          county: payload.county,
          trailname: name,
          trailtype: type,
          traillength: payload.traillength,
          grade: payload.grade,
          time: payload.time,
          nearesttown: payload.nearesttown,
          description: payload.description,
          startcoordinates: {
            latitude: payload.startlat,
            longitude: payload.startlong,
          },
          endcoordinates: {
            latitude: payload.endlat,
            longitude: payload.endlong
          },
          profileImage: 'https://res.cloudinary.com/walkways/image/upload/v1590860161/walkways-poi_qhkm66.png'
        });
        let trail = await newTrail.save();

        let profilePic='';
        if (user.profilePicture === '')
        {
          profilePic = '/images/default_user.png';
        }
        else
        {
          profilePic = user.profilePicture;
        }

        let now = new Date();
        let here = now.getTime();
        let dateString = now.getUTCFullYear() + "/" +
          ("0" + (now.getUTCMonth()+1)).slice(-2) + "/" +
          ("0" + now.getUTCDate()).slice(-2) + " " +
          ("0" + now.getUTCHours()).slice(-2) + ":" +
          ("0" + now.getUTCMinutes()).slice(-2) + ":" +
          ("0" + now.getUTCSeconds()).slice(-2);
        //console.log(dateString);

        let signUpCard = "<div class=\"ui fluid card\">\n" +
          "  <div class=\"content\">\n" +
          "    <div class=\"header\">New Trail Added to Our Community.</div>\n" +
          "    <div class=\"meta\">" + dateString + "</div>\n" +
          "    <div class=\"description\">\n" +
          "      <p>" + user.firstName + ' ' + user.lastName + " has posted a new Walkway to the community : " + trail.trailname + ". </p>\n" +
          "    </div>\n" +
          "  </div>\n" +
          "  <div class=\"extra content\">\n" +
          "    <div class=\"author\">\n" +
          "      <img class=\"ui avatar image\" src=\"" + profilePic + "\">" + user.firstName + " " + user.lastName + "\n" +
          "    </div>\n" +
          "  </div>\n" +
          "</div>";

        //console.log("SignUp card is", signUpCard);

        const newEvent = new Event({
          creator: user._id,
          eventTime: here,
          category: "general",
          event: signUpCard
        });
        await newEvent.save();

        return h.redirect('home');
      } catch (err) {
        return h.view('addPOI', { errors: [{ message: err.message }] });
      }
    }
  },
  deleteTrail: {
    handler: async function(request, h) {
      try {
        const trailID = request.params.id;
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const trail = await Trail.findById(trailID);


        if (trail.images.length > 0) {
          for (let i = 0; i < trail.images.length; i++) {
            try {
              await ImageStore.deleteImage(trail.images[i]);
            } catch (err) {
              console.log(err);
            }
          }
          let folderToDelete = user._id + '/' + trail.trailname;

          try {
            await cloudinary.api.delete_folder(folderToDelete);
          } catch (error)
          {
            console.log(error);
          }
        }
        await Trail.findOneAndDelete( { _id : trailID });

        return h.redirect('/home');
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  viewTrail: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        let owner=false;
        let areFriends = false;

        const trailID = request.params.id;
        let trail = await Trail.find( { _id : trailID }).lean();

        let current_trail = trail[0];

        let trail_name = current_trail.trailname;
        //process.env.google_maps_API;
        let currentUserID = JSON.stringify(user._id);
        let trailOwnerID = JSON.stringify(current_trail.creator);
        if( currentUserID === trailOwnerID)
        {
          owner = true;
          //console.log("YOU ARE THE CREATOR");
        }
        else{
          owner = false;
          //console.log("YOU ARE NOT THE OWNER");
        }

        // Check if they are friends. If they are then the current viewer can upload an image to the
        // trail. Need to create a news event.

        let friends = user.friends;
        for(let i = 0; i < friends.length; i++)
        {
          let currentFriend=JSON.stringify(friends[i]);
          if ((currentFriend === trailOwnerID))
          {
            areFriends = true;
          }
        }

        let userImages = await ImageStore.getUserImages(trailID);

        process.env.google_maps_API;

        return h.view('viewPOI', { title: trail_name + " Details" , trail: current_trail, user: user, owner: owner,
          google_API: process.env.google_maps_API, images: userImages, areFriends: areFriends } );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  showTrail: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();

        const trailID = request.params.id;
        const trail = await Trail.find( { _id : trailID }).lean();

        return h.view('editPOI', { title: "Edit " + trail.trailname , trail: trail , user: user} );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  updateTrail: {
    validate: {
      payload: {
        county: Joi.string().trim().regex(/^[a-zA-Z -.,]{3,40}$/).valid('Antrim',
          'Armagh',
          'Carlow',
          'Cavan',
          'Clare',
          'Cork',
          'Derry',
          'Donegal',
          'Down',
          'Dublin',
          'Fermanagh',
          'Galway',
          'Kerry',
          'Kildare',
          'Kilkenny',
          'Laois',
          'Leitrim',
          'Limerick',
          'Longford',
          'Louth',
          'Mayo',
          'Meath',
          'Monaghan',
          'Offaly',
          'Roscommon',
          'Sligo',
          'Tipperary',
          'Tyrone',
          'Waterford',
          'Westmeath',
          'Wexford',
          'Wicklow').required(),
        trailname: Joi.string().trim().regex(/^[a-zA-Z0-9 ,-.]{3,40}$/).min(6).max(30).required(),
        trailtype: Joi.string().trim().regex(/^[a-zA-Z ]{3,40}$/).min(2).max(30).required(),
        traillength: Joi.number().min(0.5).max(600).required(),
        grade: Joi.array().items(Joi.string()).single().valid('Easy',
          'Moderate',
          'Strenuous',
          'Very Difficult',
          'Wheelchair and Buggy Accessible').required(),
        time: Joi.string().trim().regex(/^([0-9]{2})\:([0-9]{2})$/).required(),
        nearesttown: Joi.string().trim().regex(/^[a-zA-Z ,-.]{3,40}$/).max(30),
        description: Joi.string().trim().min(6).max(500).regex(/^[a-zA-Z0-9 ,-.]{6,500}$/)
          .messages({ 'string.pattern.base': 'Description must be between alphanumeric or "-,."' })
          .required(),
        startlat: Joi.number().precision(6).min(51.419956).max(55.313026).required(),
        startlong: Joi.number().precision(6).min(-10.669592).max(-5.485242).negative().required(),
        endlat: Joi.number().precision(6).min(51.419956).max(55.313026) ,
        endlong: Joi.number().precision(6).min(-10.669592).max(-5.485242).negative()
      },
      options: {
        abortEarly: false
      },
      failAction: async function(request, h, error) {
        const trailID = request.params.id;
        let trail = await Trail.find( { _id : trailID }).lean();
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        return h
          .view('editPOI', {
            title: 'Edit POI Error',
            errors: error.details,
            trail: trail,
            user: user
          })
          .takeover()
          .code(400);
      }
    },
    handler: async function(request, h) {
      try {
        const trailID = request.params.id;
        let trails = await Trail.find( { _id : trailID });
        let trail = trails[0];

        const trailEdit = request.payload;

        let name = await trailEdit.trailname;
        name = name.replace(/ /g, '-');

        trails[0].county = trailEdit.county;
        trails[0].trailname = name;
        trails[0].trailtype = trailEdit.trailtype;
        trails[0].traillength = trailEdit.traillength;
        trails[0].grade = trailEdit.grade;
        trails[0].time = trailEdit.time;
        trails[0].nearesttown = trailEdit.nearesttown;
        trails[0].description = trailEdit.description;
        trails[0].startcoordinates = { latitude: trailEdit.startlat, longitude: trailEdit.startlong};
        trails[0].endcoordinates = { latitude: trailEdit.endlat, longitude: trailEdit.endlong};

        await trail.save();
        return h.redirect('/home');

      } catch (err) {
        return h.view('editPOI', { errors: [{ message: err.message }] });
      }
    }
  },
  viewAll: {
    handler: async function(request, h) {
      try {
        //console.log("HERE IN VIEW ALL");
        const userId = request.auth.credentials.id;
        const user = await User.findById(userId).lean();
        //console.log("The current user is :", user);

        const walkways = await Trail.find().populate('walkways').lean();
        //console.log("The Walkways are :",walkways);
        const users = await User.find( { type: { $ne: 'admin' } }).populate('users').lean();
        //console.log("The users are:", users);

        const allTrails = true;

        return h.view('allTrails', { title: "All Trails on Walkways ", users: users, walkways: walkways,
          user: user, currentUser: user, allTrails: allTrails } );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  postComment: {
      validate: {
        payload: {
          comment: Joi.string().trim().min(1).max(700).regex(/^[a-zA-Z0-9 ,-.]{1,700}$/)
            .messages({ 'string.pattern.base': 'Comment must be between alphanumeric or "-,."' })
        },
        options: {
          abortEarly: false
        },
        failAction: async function(request, h, error) {
        }
        },
      handler: async function(request,h){
      try {

        const userID = request.params.userID;
        //console.log("userID is : ", userID);
        const trailID = request.params.trailID;
        //console.log("trailId is : ", trailID);


        const user = await User.findById(userID);
        //console.log("user is :", user);
        const trail = await Trail.findByID(trailID);
        //console.log("trail is : ", trail);
        const walkways = await Trail.find().populate('walkways').lean();
        //console.log("walkways are: ", walkways);
        const users = await User.find( { type: { $ne: 'admin' } }).populate('users').lean();
        //console.log("users are : ", users);

        let body = request.package;
        //console.log("The Body is : ", body);


        let m = new Date();
        let dateString =
          m.getUTCFullYear() + "/" +
          ("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
          ("0" + m.getUTCDate()).slice(-2) + " " +
          ("0" + m.getUTCHours()).slice(-2) + ":" +
          ("0" + m.getUTCMinutes()).slice(-2) + ":" +
          ("0" + m.getUTCSeconds()).slice(-2);
        //console.log(dateString);

        const newComment = new Comment({
          content: request.payload.comment,
          postedBy: {
            userId: userID,
            userName: user.firstName + ' ' + user.lastName,
            profilePicture: user.profilePicture
          },
          time: dateString
        })

        await trail.comments.push(newComment);
        await trail.save();

        let commentTrail = await Trail.findByID(trail.id);
        //console.log("The trail commented on is: ", commentTrail);

        let commentTrailID = commentTrail._id;
        let commentID = newComment._id;
        //console.log("New Comment Id is ", commentID);

        await User.updateOne( { _id: userID}, { $push: { comments: { commentID, commentTrailID } } } );

        // Create an Event here to say user has made a comment
        let now = new Date();
        let here = now.getTime();

        let profilePic='';
        if (user.profilePicture === '')
        {
          profilePic = '/images/default_user.png';
        }
        else
        {
          profilePic = user.profilePicture;
        }

        let eventDateString = now.getUTCFullYear() + "/" +
          ("0" + (now.getUTCMonth()+1)).slice(-2) + "/" +
          ("0" + now.getUTCDate()).slice(-2) + " " +
          ("0" + now.getUTCHours()).slice(-2) + ":" +
          ("0" + now.getUTCMinutes()).slice(-2) + ":" +
          ("0" + now.getUTCSeconds()).slice(-2);
        //console.log(eventDateString);

        let signUpCard = "<div class=\"ui fluid card\">\n" +
          "  <div class=\"content\">\n" +
          "    <div class=\"header\">New Comment</div>\n" +
          "    <div class=\"meta\">" + eventDateString + "</div>\n" +
          "    <div class=\"description\">\n" +
          "      <p>" + user.firstName + ' ' + user.lastName + " has Posted a comment on our community. </p>\n" +
          "    </div>\n" +
          "  </div>\n" +
          "  <div class=\"extra content\">\n" +
          "    <div class=\"author\">\n" +
          "      <img class=\"ui avatar image\" src=\"" + profilePic + "\">" + user.firstName + " " + user.lastName + "\n" +
          "    </div>\n" +
          "  </div>\n" +
          "</div>";

        //console.log("SignUp card is", signUpCard);

        const newEvent = new Event({
          creator: user._id,
          eventTime: here,
          category: "friends",
          event: signUpCard
        });
        await newEvent.save();

        return h.redirect('/allTrails/' +userID);

      } catch(err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
  viewProfile: {
    handler: async function(request, h) {
      try {
        let currentUserId = request.auth.credentials.id;

        let currentUser = await User.findById(currentUserId).lean();
        console.log("Current user is :", currentUser);

        const personToView = request.params.otherID;
        const profiledUser = await User.findById(personToView).lean();
        //console.log("Profile to see is :", profiledUser);

        //If current user is viewing own profile go to home
        if (currentUserId === personToView)
        {
          const walkways = await Trail.find ( { creator: currentUserId } ).populate('walkways').lean();
          //console.log("walkways are : ", walkways);
          return h.view('home', { title: 'Welcome to Walkways', user: currentUser, walkways: walkways });
        }

        //Search through currentUser Friends List to see if profiled user
        // is in their friend list.
        //let friends = currentUser.friends;
        //console.log("Friends are : ", friends);
        //let areFriends = friends.includes(personToView);
        let areFriends = await User.findOne( { $and: [ { _id: currentUserId}, { friends: profiledUser._id } ] } );
        console.log("Friends status is :", areFriends);

        let requestSent = await User.findOne( { $and: [ { _id: currentUserId}, { requestsSent: profiledUser._id } ] } );
        //console.log("REQS are:", reqs);
        console.log("profiledUser is : ", profiledUser);
        console.log("Request Sent is : ", requestSent);

        let profiledUserName = profiledUser.firstName + ' ' + profiledUser.lastName;

        let walkways = await Trail.find( { creator: profiledUser._id }).populate('trail').lean();

        let POI_total = walkways.length;

        let total_images = 0;

        for (let i =0; i < walkways.length; i++)
        {
          let imageNumber = walkways[i].images.length;
          total_images = total_images + imageNumber;
        }

        return h.view('viewProfile', { title: profiledUserName + ' Details', walkways: walkways,
          user: profiledUser, currentUser: currentUser, areFriends: areFriends,
          POI_total: POI_total, total_images: total_images, requestSent: requestSent});
      }
      catch (err) {
        return h.view('main', { errors: [{ message: err.message }] });
      }
    }
  },
  userViewTrail: {
    handler: async function(request, h) {
      try {
        console.log("HERE THROUGH THE ALL VIEW");
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        console.log("The logged in user is : ", user.firstName);
        let owner = false;
        let areFriends = false;

        const trailID = request.params.trailId;
        let trail = await Trail.find( { _id : trailID }).lean();

        let current_trail = trail[0];

        let trail_name = current_trail.trailname;

        let userImages = await ImageStore.getUserImages(trailID);

        // Check to see if the current viewing user is the owner of the trail.
        let currentUserID = JSON.stringify(user._id);
        let trailOwnerID = JSON.stringify(current_trail.creator);
        if( currentUserID === trailOwnerID)
          {
            owner = true;
            areFriends = true;
            //console.log("YOU ARE THE CREATOR");
          }
          else{
            owner = false;
            areFriends= false;
            //console.log("YOU ARE NOT THE OWNER");
          }

        // Check if they are friends. If they are then the current viewer can upload an image to the
        // trail. Need to create a news event.

        let friends = user.friends;
          for(let i = 0; i < friends.length; i++)
          {
            let currentFriend=JSON.stringify(friends[i]);
            if ((currentFriend === trailOwnerID))
            {
              areFriends = true;
            }
          }

        return h.view('viewPOI', { title: trail_name + " Details" , trail: current_trail, user: user,
          google_API: process.env.google_maps_API, images: userImages, owner: owner, areFriends: areFriends } );
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
      }
    }
  },
};

module.exports = Walkways;