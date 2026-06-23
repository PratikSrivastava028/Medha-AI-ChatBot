const cookieParser = require('cookie-parser');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const authRoutes = require("../routes/auth.routes")

async function authUser(req,res,next){
    const {token} = req.cookies;

    if(!token){
        return res.status(401).json({
            msg:"Unauthorised access"
        })
    }
    try{
const decoded =  jwt.verify(token,process.env.JWT_SECRET);
const user = await userModel.findById(decoded.id);
req.user = user;
next();
    }
    catch(err){
        res.status(401).json({
             msg:"Unauthorised access"
        })
    }
}

module.exports = {authUser}