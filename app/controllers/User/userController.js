const User=require("../../models/User")
const { generatePassword,sendEmail } = require('../../utils/utils');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongoose").Types;
const {uploadFileToS3}=require('../../utils/utils');
const config = require("../../config/auth.config")
exports.addUser= async (req, res) => {
    try {
      const { firstName, lastName, email, phoneNumber } = req.body;

      if (!firstName || !lastName || !email || !phoneNumber) {
        return res.status(400).json({ message: 'All fields are required.' });
      }
  
     
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists.' });
      }
  
      const password = generatePassword(firstName, lastName, phoneNumber);
      const hashedPassword = await bcrypt.hash(password, 10);
  
     
      user = new User({
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword
      });
  
      await user.save();
  
      // Send welcome email with the password
      await sendEmail(email, password);
  
      return res.status(201).json({ message: 'User created successfully. Check your email for the password.' });
   
    } catch (error) {
    console.error('Error in addUser:', error);
    return res.status(500).json({ message: 'Server Error' });
    }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const UserData = await User.findOne({ email: email });
    if (!UserData) {
      return res.status(404).json({ statusCode: 404, message: "Account doesn't exist" });
    }

    // Compare the password
    let isMatch = await UserData.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ statusCode: 401, message: "Password is incorrect" });
    }
    const accessToken = jwt.sign(
      { _id: UserData._id },
      config.secret,
      {
        algorithm: "HS256",
        expiresIn: "1d",
      }
    );
    console.log("accessToken", { email, password }, accessToken)
    const sanitizedUser = UserData.toObject();
    delete sanitizedUser.password;
    return res.status(200).json({
      statusCode: 200,
      message: "Login successful!",
      token: accessToken,
      user: sanitizedUser,
    });
  } catch (err) {
    console.log(err)
    return res.status(500).send({ statusCode: 500, message: "something went wrong" });
  }
};

exports.getUserDetails= async (req, res) => {
  try {
    const userDetails = await User.findOne({_id:(req.userId)},{updatedAt:0,__v:0,password:0});
    if(!userDetails){
      return res.status(404).json({ statusCode: 404, message: "No user found" });
    }
    return res.status(200).json({ statusCode: 200, userDetails:userDetails });
  } catch (err) {
    console.log(err)
    return res.status(500).send({ statusCode: 500, message: "something went wrong" });
  }
};

exports.getListOfUser= async (req, res) => {
  try{
    const users = await User.find({},{updatedAt:0,__v:0,password:0});
    if(!users){
      return res.status(404).json({ statusCode: 404, message: "No user found" });
    }
    return res.status(200).json({ statusCode: 200, users });
  }catch(e){
    console.log(e);
    return res.status(500).json({ statusCode: 500, message: "something went wrong" });
  }
}

exports.updateUserData=async(req, res) => {
  try{
    console.log("Updating user data")
    const {bio}=req.body;
    const userId = req.userId;

    if (!bio) {
      return res.status(400).json({ message: "Invalid input" });
    }
  
    const user = await User.findByIdAndUpdate(
      userId,
      { bio },
      { new: true }
    );
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    return res.status(200).json({ user });
  }catch(error){
   console.log(error);
  }
}

exports.uploadImage = async (req,res) => {
  try {
    const fileData = req.file;
    let sizeLimit,folderName
    const result = await uploadFileToS3(fileData,sizeLimit=1024 * 500,folderName="Images");
    let filePath = result.location;
    if (result.error && result.statusCode===413) {
    return res.status(413).json({
    statusCode: result.statusCode,
    message: result.message,
    });
    } 
      
    await User.updateOne(
      { _id:(req.userId) },
      { $set: { imageUrl: filePath } }
    );

    return res.status(200).json({
      message: "Image uploaded successfully",
      filePath
    });
  } catch (error) {
      console.log(error);
     
  }
} 

exports.uploadVideo = async (req, res, next) => {
  try {
    const fileData = req.file;
    const { title, description } = req.body; 
    let sizeLimit,folderName
    const result = await uploadFileToS3(fileData,sizeLimit=6 * 1024 * 1024,folderName="Images");

    if (result.error && result.statusCode === 413) {
      return res.status(413).json({
        statusCode: result.statusCode,
        message: result.message,
      });
    }

    let filePath = result.location;

    const newVideo = {
      videoUrl: filePath,
      title: title, 
      description: description, 
    };

    await User.updateOne(
      { _id: req.userId },
      { $push: { videos: newVideo } }  );

    return res.status(200).json({
      message: "Video uploaded successfully",
      filePath,
    });
  } catch (error) {
    console.log(error);
   
  }
};
