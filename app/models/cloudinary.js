'use strict';


$(function() {
  if($.fn.cloudinary_fileupload !== undefined) {
    $("input.cloudinary-fileupload[type=file]").cloudinary_fileupload();
  }
});

var myWidget = cloudinary.createUploadWidget({
    cloudName: 'walkways',
    uploadPreset: 'my_preset',
    folder: '/ObjectID',
    tags: [ 'POI', 'UserName', 'POI Name']}, (error, result) => {
    if (!error && result && result.event === "success") {
      console.log('Done! Here is the image info: ', result.info);
    }
  }
)
document.getElementById("upload_widget").addEventListener("click", function(){
  myWidget.open();
}, false);