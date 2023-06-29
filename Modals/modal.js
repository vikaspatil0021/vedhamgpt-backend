import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email:String,
    fName:String
});

const UserInfo = mongoose.model("user",userSchema);


export {
    UserInfo
}