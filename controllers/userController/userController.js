const bcrypt =  require("bcryptjs")
const {UserModel} =  require("../../model/schema")

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

module.exports = {handleRegisterUser}