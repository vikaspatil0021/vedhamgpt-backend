import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';

import dotenv from "dotenv";
dotenv.config();

import { UserInfo } from "./../Modals/modal.js";
const otpStore = new Map();

const router = express.Router();



const authenticateToken = (req, res, next) => {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json('Forbiddon');
    }

    jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({Error:err});
        }
        req.user = decoded;
        next();
    });
}

// Function to generate a 5-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const sendOTP = async (email, otp, res) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'vikaspatil2103b@gmail.com',
            pass: 'xilqjyzhongocyyx'
        }
    });

    var mailOptions = {
        from: 'vikaspatil2103b@gmail.com',
        to: email,
        subject: 'OTP for Vedham',
        text: 'Welcome to Vedham. Your five digit OTP is ' + otp
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            res.send({ error: error.message });
        } else {
            res.send({ EmailSent: info.response });
        }
    });
}

router.post("/authorization-g", async (req, res) => {

    const { email } = req.body;

    try {
        const otp = generateOTP();

        // Store the OTP in memory with the mobile number as the key
        otpStore.set(email, otp);

        await sendOTP(email, otp, res);

    } catch (error) {
        res.send({ Error: error.message })

    }
});


router.post("/authorization-v", async (req, res) => {
    const { email, otp, fName } = req.body;

    try {
        const storedOtp = otpStore.get(email);

        if (storedOtp !== otp) {
            return res.status(401).send({ Error: 'Wrong OTP' })
        }

        const existingUser = await UserInfo.findOne({ email });
        if (!existingUser) {
            var user = await UserInfo.create({
                email,
                fName
            });

            var jwtOptions = {
                user_id: user._id
            }

        } else {

            jwtOptions = {
                user_id: existingUser._id
            }
        }

        const token = jwt.sign(jwtOptions, process.env.TOKEN_SECRET_KEY, { expiresIn: 60*60*24 });

        res.status(200).json({ status: "ok", token: token });
    } catch (error) {
        res.send({ Error: error.message })
    }
});


router.get('/prompt.txt',(req,res)=>{
        var text =`[ { "name": "sunset", "value": 0.9900964498519897 }, { "name": "man", "value": 0.9701204299926758 }, { "name": "sun", "value": 0.967401921749115 }, { "name": "travel", "value": 0.965423583984375 }, { "name": "one", "value": 0.9653750061988831 }, { "name": "portrait", "value": 0.9652539491653442 }, { "name": "summer", "value": 0.9615834951400757 }, { "name": "outdoors", "value": 0.9578759074211121 }, { "name": "leisure", "value": 0.9568157196044922 }, { "name": "sky", "value": 0.9538112878799438 }, { "name": "sunglasses", "value": 0.9520582556724548 }, { "name": "fair weather", "value": 0.947190523147583 }, { "name": "landscape", "value": 0.9377776980400085 }, { "name": "beach", "value": 0.9292415380477905 }, { "name": "people", "value": 0.9278106689453125 }, { "name": "nature", "value": 0.9169023036956787 }, { "name": "recreation", "value": 0.9128032326698303 }, { "name": "water", "value": 0.8943551778793335 }, { "name": "grass", "value": 0.8860621452331543 }, { "name": "relaxation", "value": 0.8809468746185303 }] generate an short instagram caption based on only relevent name provided in the array`
        // res.attachment('./prompt.txt')
        res.type('txt')
        res.send(text)
    
})


export default router;