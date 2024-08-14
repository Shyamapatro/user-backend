const nodemailer = require('nodemailer');
const multer = require("multer");
const aws = require('aws-sdk');
aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESSKEY,
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: process.env.REGION,
    signatureVersion: process.env.SIGNATURE_VERSION,
});
const s3 = new aws.S3();

const generatePassword = (firstName, lastName, number) => {
    const passwordParts = [];
    const minLength = 6;
    const maxLength = 12;

    const combinedString = firstName + lastName + number;

    const passwordLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    const usedIndices = new Set();

    while (passwordParts.length < passwordLength) {
        const randomIndex = Math.floor(Math.random() * combinedString.length);

        if (!usedIndices.has(randomIndex)) {
            usedIndices.add(randomIndex); 
            passwordParts.push(combinedString[randomIndex]);
        }
    }
    
    // console.log(passwordParts.join(''))
    return passwordParts.join('');
};

const sendEmail = async (email, password) => {
    
    const mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        auth: {
            user: process.env.Email, 
            pass: process.env.pass 
          }
    });

    const mailDetails = {
        from: process.env.Email,
        to: email,
        subject: 'Your Account Has Been Successfully Created',
        html: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #4CAF50;">Welcome to [Your Company Name]!</h2>
            <p>We're excited to have you on board. Your account has been successfully created.</p>
            <p><strong>Your login credentials are:</strong></p>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${password}</li>
            </ul>
            </div>`
    };

    try {
        const info = await mailTransporter.sendMail(mailDetails);
        console.log('Email sent successfully:', info.messageId);
    } catch (err) {
        console.error('Error occurs while sending email:', err);
    }
};

const uploadFileToS3 = async (fileData,sizeLimit,folderName) => {
    try {
        const fileData1 = fileData.buffer;
        console.log(fileData,"fileData1")
        if (fileData.size > sizeLimit) {
        return {
            error:true,
            message: "File size exceeds",
            statusCode: 413
        };
        
        }
        console.log("....",{fileData,sizeLimit,folderName})
        const fileExtension = fileData.mimetype.split('/').pop();
        const uniqueSuffix = Math.round(Math.random() * 1E9) + Date.now(); 
        const uploadedFileData = await s3.upload({
            Bucket:`${process.env.BucketName}/${folderName}`,
            Key:`${uniqueSuffix}.${fileExtension}`,
            Body:fileData1,
            ContentType:fileData.mimetype,
            ACL: 'public-read',
            ContentLengthRange: { Min: 0, Max: sizeLimit } 
        }).promise()
      
        const { Location } = uploadedFileData
                
        return {
            error:false,
            location : Location
        };
    } catch (error) {
        console.log(error.message,"upload failed");
        return {
            error:error.message
        }
    }
}

const videoUploader = multer({
    limits: { fileSize: 1024 * 1024 * 6 }, // 6 MB limit
    fileFilter: function(req, file, cb) {
        console.log("Received MIME type:", file.mimetype);
        if (file.mimetype === "video/mp4") {
            cb(null, true);
        } else {
            console.log("Multer Error -- Only mp4 files are allowed");
            req.fileValidationError = "Forbidden extension";
            return cb(null, false, req.fileValidationError);
        }
    }
});

const imageUploader = multer({
    limits: { fileSize: 1024 * 500 }, 
    fileFilter: function(req, file, cb) {
        console.log("Received MIME type:", file.mimetype);
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" || file.mimetype === "image/png") {
            cb(null, true);
        } else {
            console.log("Multer Error -- Only jpeg, jpg, and png files are allowed");
            req.fileValidationError = "Forbidden extension";
            return cb(null, false, req.fileValidationError);
        }
    }
});



module.exports = {
    generatePassword,
    sendEmail,
    videoUploader,
    imageUploader,
    uploadFileToS3
};
