import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email: String,
    fName: String
});

const completionSchema = mongoose.Schema({
    date: String,
    data:{
        imageURL:String,
        inputText:String,
        outputText:String
    }
});

const UserInfo = mongoose.model("user", userSchema);
const CompletionInfo = mongoose.model("completion", completionSchema);


export {
    UserInfo,
    CompletionInfo
}