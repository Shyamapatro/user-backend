
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const videoSchema = new mongoose.Schema({
    videoUrl: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: {type: String,required: true},
    email: {type: String,required: true},
    phoneNumber: { type: String ,required:true},
    password: { type: String },
    bio: {type: String,required:false},
    videos: { type: [videoSchema], required: false },
    imageUrl: {type: String,required:false}
}, { timestamps: true });

userSchema.methods.comparePassword = function(candidatePassword) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return reject(err);
        resolve(isMatch);
      });
    });
  };
  
module.exports = mongoose.model("user", userSchema);
