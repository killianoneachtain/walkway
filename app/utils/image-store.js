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

  getUserImages: async function(id) {
    const result = await cloudinary.api.publish_by_tag(id);
    return result.resources;
  },

  uploadImage: async function(imagefile, user_id, trail_id) {

    let trail = await Trail.find( { _id : trail_id });
    let trailname = trail[0].trailname;
    let folder = user_id + '/' + trailname;
    await writeFile('./public/temp.img', imagefile);
    await cloudinary.uploader.upload('./public/temp.img', { folder: folder, tags: [user_id, trail_id, trailname] },
      function(error,result) {console.log(result,error)} );
  },

  deleteImage: async function(id) {
    await cloudinary.v2.uploader.destroy(id, {});
  },

};

module.exports = ImageStore;