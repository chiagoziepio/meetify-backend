const bcrypt =  require("bcryptjs")
const {UserModel} =  require("../../model/schema")
const jwt = require("jsonwebtoken")
const handleverifyToken = require("../../middleware/verifyJwt")
const cloudinaryConfig = require("../../config/cloudinaryConfig")
const { v2: uuidv2 } = require('uuid'); // For generating unique filenames
const streamifier = require('streamifier'); // Convert buffer to stream
const {handleTokenVerification} = require("../../middleware/verifyJwt")
const fs = require('fs');
const handleRegisterUser = (async(req,res)=>{
    const {fullname,password,username,email,phone_number} = req.body
    if(!fullname || !password || !username || !email || !phone_number) return res.status(400).json({status: "failed", msg:"Fill all blank"});
    
    try {
        const isUserAlreadyExisting = await UserModel.findOne({email});
        if(isUserAlreadyExisting) return res.status(400).json({status: "failed", msg:"user already existed"})
         
        const hashPwd = await bcrypt.hash(password, 10);
        const newUser =  new UserModel({
            fullname,
            username,
            email,
            phone: +phone_number,
            password: hashPwd
        });
        newUser.save()
    
        
        return res.status(201).json({status: "success", msg:"User created" })
    } catch (error) {
        console.log(error);
       return res.status(500).json({status: "failed", msg: `server error: ${error}`})
    
    }
})
const handleUserLogin = (async(req,res)=>{
   const {email,password} = req.body
   if(!email || !password) return res.status(400).json({status: "failed", msg: "provide credential"});
   
   try {
        const findUser = await UserModel.findOne({email})
        if(!findUser) return res.status(400).json({status: "failed", msg: "user not registered" })
        const checkPwd = await bcrypt.compare(password,findUser.password);
        if(!checkPwd) return res.status(400).json({msg: "incorrect password", status: "failed" });
        const refreshToken = jwt.sign({email:findUser.email},process.env.REFRESHTOKEN_SECRET_KEY,{expiresIn: "2h"});
        const userObj = {findUser, token: refreshToken}
       // res.cookie("refreshtoken",refreshToken,{maxAge: 1800000, httpOnly: true,sameSite: 'None'})
        return res.status(200).json({status: "success", msg: "User logged in", user: userObj})

   } catch (error) {
    console.log(error);
    return res.status(500).json({status: "failed", msg: `server error: ${error}`})
    
   }
})

const handleUserProfilePicUpload = (async(req,res)=>{
   
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;
    
    
    try {
        if(!token) return res.status(401).json({status: "failed", msg: "access denied"})
            const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY)
            if(!decoded) return res.status(401).json({status: "failed", msg: "invalid token"})
            const email =  decoded.email
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }
            const filePath = req.file.path;
            const result = await cloudinaryConfig.uploader.upload(filePath, {
                folder: 'meetifyPic',
              });
              fs.unlinkSync(filePath)
        
            const findUser = await UserModel.updateOne(
                { email: email },
                { $set: { 
                    profilePic: result.secure_url } }
              );
            
        return res.status(200).json({status: "success", msg: "image updated", url: result.secure_url})
    } catch (error) {
        return res.status(501).json({status: "failed", msg: error})
    }
})

module.exports = {handleRegisterUser,handleUserLogin,handleUserProfilePicUpload}