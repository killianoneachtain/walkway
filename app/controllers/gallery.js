'use strict';

const ImageStore = require('../utils/image-store');
const Trail = require('../models/trail');

const Gallery = {
  index: {
    handler: async function(request, h) {
      try {
        const allImages = await ImageStore.getAllImages();
        return h.view('gallery', {
          title: 'Cloudinary Gallery',
          images: allImages
        });
      } catch (err) {
        console.log(err);
      }
    }
  },
  uploadFile: {
    handler: async function(request, h) {
      try {
        const user_id = request.auth.credentials.id;
        const trailID = request.params.id;

        const file = request.payload.imagefile;
        if (Object.keys(file).length > 0) {
          await ImageStore.uploadImage(request.payload.imagefile, user_id, trailID);
          return h.redirect('/viewPOI/'+ trailID);

        }
        return h.redirect('/viewPOI/' + trailID, {
          title: 'UPLOAD ERROR!',
          error: 'No file selected'
        });
      } catch (err) {
        console.log(err);
      }
    },
    payload: {
      multipart: true,
      output: 'data',
      maxBytes: 209715200,
      parse: true
    }
  },
  deleteImage: {
    handler: async function(request, h) {

      try {
        let publicID = request.params.id + '/' + request.params.foldername + '/' + request.params.imagename;
        await ImageStore.deleteImage(publicID);

        //need to delete the index from the trail images array here

        let trails= await Trail.findByName(request.params.foldername);
        let trail = trails[0];
        console.log("TRail to delete image from is", trail);

        let trailImages = trail.images;
        let trailToBeDeleted = '';
        let i =0;

        for (i=0;i<trailImages.length;i++)
        {
          let n = trailImages[i].search(publicID);
          if (n >= 0){
            trailToBeDeleted = trailImages[i];
          }
        }

        console.log("TRAIL IMAGES ARE : ",trail.images);

        console.log("Trail to be delted is : ", trailToBeDeleted);


        let updateImageArray = await Trail.updateOne( { _id: trail._id }, { $pull: { images: trailToBeDeleted } } );
        console.log("Up Date image ARRAY result is: ",updateImageArray);

        //console.log("Delete image from Gallery is ", update_Trail);

        trail.save();

        return h.redirect('/viewPOI/' + trail._id);
      } catch (err) {
        console.log(err);
      }
    }
  },
  uploadProfilePicture: {
    handler: async function(request, h) {
      try {
        const user_id = request.auth.credentials.id;

        const file = request.payload.imagefile;
        if (Object.keys(file).length > 0) {
          await ImageStore.uploadProfilePicture(request.payload.imagefile, user_id);
          return h.redirect('/settings');
        }
        return h.redirect('/settings', {
          title: 'UPLOAD ERROR!',
          error: 'No file selected'
        });
      } catch (err) {
        console.log(err);
      }
    },
    payload: {
      multipart: true,
      output: 'data',
      maxBytes: 209715200,
      parse: true
    }
  },
};

module.exports = Gallery;
