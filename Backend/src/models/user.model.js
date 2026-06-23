const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
     email:{
        type:String,
        required:true,
        unique:true
    },
    fullName:{
       firstName:{
          type:String,
        required:true
       },
       lastName:{
          type:String,
        required:true
       }
    },
    password:{
        required:true,
        type:String
    },
   
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

module.exports = userModel