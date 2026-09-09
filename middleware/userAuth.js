
const jwt = require("jsonwebtoken");

async function userAuth(req,res,next) {
    
    const { token } = req.cookies;

    if(!token){
        return res.json({success:false , message:"Not Authorized"})
    };

    try {   
     const tokenDecode =   jwt.verify(token,process.env.SECRET_KEY);
     if(tokenDecode.id){
        req.userID = tokenDecode.id;
     }else{
        return res.json({success:false , message:"Not Authorized. Login Again"})
     };

     next()

    } catch (error) {
       res.json({success:false, message:error.message}) 
    }
}

module.exports = userAuth;