'use strict';

const cloudinary = require('cloudinary').v2;
const User = require('../models/user');
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const Trail = require('../models/trail');

const ImageStore = {
  configure: function() {
    const credentials = {
      cloud_name: process.env.name,
      api_key: process.env.key,
      api_secret: process.env.secret
    };
    cloudinary.config(credentials);
  },

  getAllImages: async function() {
    const result = await cloudinary.api.resources();
    return result.resources;
  },

  getUserImages: async function(user_id) {
    const result = await cloudinary.api.resources_by_tag(user_id);
    //console.log("RESULTS FROM getUserImages : ",result);
    return result.resources;
  },

  uploadImage: async function(imageFile, user_id, trail_id) {

    let trail = await Trail.find( { _id : trail_id }).lean();
    let user = await User.findOne( { _id: user_id } ).lean();


    let trailName = trail[0].trailname;
    let folder = user_id + '/' + trailName;

    await writeFile('./public/temp.img', imageFile);
    const uploaded_image = await cloudinary.uploader.upload('./public/temp.img', { folder: folder,
        tags: [user_id, trail_id, trailName], width: 600, height: 600, gravity: "center", crop: 'pad',
        fetch_format: "auto", type: 'authenticated', quality_analysis: true, format: 'jpg' },
      function(error,result) {/*console.log("Error is :", error)*/} );

    let this_trail = trail[0];
    console.log("Trail is",trail);
    //this_trail.images.push(uploaded_image.secure_url);
    //this_trail.profileImage = uploaded_image.secure_url;
    await Trail.updateOne( { _id: this_trail._id }, { $push: { images: uploaded_image.public_id } } );
    await Trail.updateOne( { _id: this_trail._id }, { profileImage: uploaded_image.secure_url } );
    //await this_trail.save();

    let this_user = user;
    console.log("User is",this_user);
    await User.updateOne( { _id: this_user._id}, { $push: { allImages: uploaded_image.public_id } } );
    //await this_user.save();

    //console.log("Uploaded image is : ", uploaded_image);
  },
  uploadProfilePicture: async function(imageFile, user_id) {
    let user = await User.find ( { _id: user_id });
    let folder = user_id + '/Profile_Picture';
    await writeFile('./public/temp.img', imageFile);
    const uploaded_image = await cloudinary.uploader.upload('./public/temp.img', { folder: folder,
        tags: [user_id, 'Profile Picture'], width: 600, height: 600, gravity: "center", crop: 'pad',
        fetch_format: "auto", type: 'authenticated', quality_analysis: true, format: 'jpg' },
      function(error,result) {/*console.log("Error is :", error)*/} );

    let this_user = user[0];
    this_user.allImages.push(uploaded_image.public_id);
    this_user.profilePicture = uploaded_image.secure_url;
    this_user.profilePID = uploaded_image.public_id;
    await this_user.save();
    //console.log("Uploaded image is : ", uploaded_image);
  },

  deleteImage: async function(id) {
    try {
      console.log("VALUE OF ID is : ", id);
      let deleteFunction = await cloudinary.api.delete_resources([id], {type: 'authenticated' },function(error, result)
      { /*console.log( "Error: ",error)*/ });
      console.log("result of delete is ", deleteFunction);
    } catch (err) {
      console.log(err);
    }
  },

  deleteProfilePicture: async function(id)
  {
    try{
      let deleteFunction = await cloudinary.api.delete_resources( [id], {type: 'authenticated' },function(error,result)
      {/*console.log ("Error: ", error)*/ });
      //console.log("result of profile picture delete for ", id, " is ", deleteFunction);
    } catch (err) {
      console.log(err);
    }
  }
};

module.exports = ImageStore;