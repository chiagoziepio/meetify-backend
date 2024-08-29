const bcrypt =  require("bcryptjs")
const {UserModel} =  require("../../model/schema")
const jwt = require("jsonwebtoken")

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
        const accessToken = jwt.sign({email: findUser.email},process.env.ACCESSTOKEN_SECRET_KEY,{expiresIn:"5m"});
        const refreshToken = jwt.sign({email:findUser.email},process.env.REFRESHTOKEN_SECRET_KEY,{expiresIn: "2h"});
        
        res.cookie("refreshToken",refreshToken,{maxAge: 7200000,sameSite: 'None', secure: true})
        return res.status(200).json({status: "success", msg: "User logged in", accessToken: accessToken, user: findUser})

   } catch (error) {
    console.log(error);
    return res.status(500).json({status: "failed", msg: `server error: ${error}`})
    
   }
})

module.exports = {handleRegisterUser,handleUserLogin}