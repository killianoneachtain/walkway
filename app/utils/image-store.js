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

  getUserImages: async function(user_id, trail_id) {
    const result = await cloudinary.api.resources_by_tag(user_id, trail_id);
    return result.resources;
  },

  uploadImage: async function(imagefile, user_id, trail_id) {

    let trail = await Trail.find( { _id : trail_id });
    let trailname = trail[0].trailname;
    let folder = user_id + '/' + trailname;
    await writeFile('./public/temp.img', imagefile);
    const uploaded_image = await cloudinary.uploader.upload('./public/temp.img', { folder: folder,
        tags: [user_id, trail_id, trailname], crop: 'pad' , type: 'authenticated', quality_analysis: true, format: 'jpg',
      eager: [ { width: 600, height: 800 } ] },
      function(error,result) {console.log("Error is :", error)} );

    console.log("Uploaded image is : ", uploaded_image);
  },

  deleteImage: async function(id) {
    await cloudinary.v2.uploader.destroy(id, {});
  },

};

module.exports = ImageStore;