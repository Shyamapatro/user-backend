const routeBaseUrl = "/api/user"; 
const userController = require("../../controllers/User/userController")
const validator = require("./celebrateValidator")
const authJwt= require("../../middlewares/authJWT.js");

const {videoUploader,imageUploader} = require('../../utils/utils.js');
module.exports = app => {
  app.post(routeBaseUrl + "/signup",validator.addUser, userController.addUser);
  app.post(routeBaseUrl + "/login", validator.login, userController.loginUser);
  app.get(routeBaseUrl + "/getUserDetails",[authJwt.verifyToken],userController.getUserDetails);
  app.get(routeBaseUrl + "/getListOfUser",userController.getListOfUser);
  app.put(routeBaseUrl + "/updateUserData",[authJwt.verifyToken],userController.updateUserData);
  app.put(routeBaseUrl + "/upload-video",[authJwt.verifyToken],videoUploader.single("video"),function(req, res,next) {
    if (req.fileValidationError) {
       res.status(400).json({
       statusCode: 400,
       message: "Multer Error -- Only mp4 are allowed"
     })
   }else{
       next()
     }
    },userController.uploadVideo);
  app.put(routeBaseUrl + "/upload-profile",[authJwt.verifyToken],imageUploader.single("profileImage"),function(req, res,next) {
    if (req.fileValidationError) {
       res.status(400).json({
       statusCode: 400,
       message: "Multer Error -- Only jpeg,jpg and png files are allowed"
     })
   }else{
       next()
     }
    },userController.uploadImage);
}