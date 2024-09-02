const jwt = require("jsonwebtoken")

const handleTokenVerification = (req,res,next)=>{
    

   const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    //console.log('Authorization Header:', authHeader);
    console.log('Extracted Token:', token);
    try {
        if(!token) return res.status(401).json({status: "failed", msg: "access denied"})
        const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY)
        if(!decoded) return res.status(401).json({status: "failed", msg: "invalid token"})
        console.log(decoded);
        req.user = {
            email: decoded.email
        }
        //console.log(req.user);
        
        //res.status(200).json({msg: "verified"})
    
        next()
        return req.user
    } catch (error) {
        return res.status(500).json({status: "failed", msg: "failed to verify token"})
    }
    
}

module.exports = {handleTokenVerification}

