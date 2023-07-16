import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email: String,
    fName: String
});

const completionSchema = mongoose.Schema({
    user_id:String,
    date: String,
    data: []
});

const UserInfo = mongoose.model("user", userSchema);
const CompletionInfo = mongoose.model("completion", completionSchema);


export {
    UserInfo,
    CompletionInfo
}