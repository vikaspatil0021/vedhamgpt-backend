import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';

import dotenv from "dotenv";
dotenv.config();

import { UserInfo } from "./../Modals/modal.js";
const otpStore = new Map();


// setup for clarifai api
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_KEY}`);

// setup for openai api
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const router = express.Router();



const authenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json('Forbiddon');
    }

    jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ Error: err });
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

        const token = jwt.sign(jwtOptions, process.env.TOKEN_SECRET_KEY, { expiresIn: 60 * 60 * 24 });

        res.status(200).json({ status: "ok", token: token });
    } catch (error) {
        res.send({ Error: error.message })
    }
});





// predict image concepts(labels)

const predictImage = (inputs) => {
    return new Promise((resolve, reject) => {
        stub.PostModelOutputs(
            {
                user_app_id: {
                    "user_id": "clarifai",
                    "app_id": "main"
                },
                model_id: "general-image-recognition",
                inputs: inputs
            },
            metadata,
            (err, response) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (response.status.code !== 10000) {
                    reject("Received failed status: " + response.status.description + "\n" + response.status.details);
                    return;
                }

                const output = response.outputs[0].data.concepts;

                const filteredOutput = output.filter(each => {
                    if (each.value >= 0.8) {
                        return each;
                    }
                })
                const concepts = filteredOutput.map(each => {
                    return each.name;

                })

                resolve(concepts)
            }
        );

    })
}


// generate a caption from labels
const openaiCaption = (labelArr) => {
    return new Promise((resolve, reject) => {

        openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${labelArr} generate an elegant and classic instagram caption based on labels and use hashtags not more than 3`,
            max_tokens: 300,
            temperature: 0.1,
         }).then((response)=>{
           
           resolve(response.data.choices[0].text);
         }).catch(err=>{
          reject(err)
         })
   })


}

// prompt 

router.post('/prompt', authenticateToken, async (req, res) => {
    try {
        const { imageURL } = req.body;

        const inputs = [
            {
                data: {
                    image: {
                        url: imageURL
                    }
                }
            }
        ]

        const resultLabels = await predictImage(inputs);
        const result = await openaiCaption(resultLabels);

        return res.send({
            result
        })

    } catch (error) {
        res.status(400).send({ Error: error.message })
    }
})


export default router;