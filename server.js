import express from "express";
import mongoose from "mongoose"; 
import bodyParser from "body-parser";
import router from "./Routes/router.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();

import cors from "cors";
const corsOptions = {
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200,
    origin: ["http://localhost:3000","https://vedhamgpt.vercel.app"]
}


mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(cors(corsOptions));





app.use(router)
app.listen(process.env.PORT || 5000,(req,res)=>{

    console.log("Server has started on port 5000.");

})