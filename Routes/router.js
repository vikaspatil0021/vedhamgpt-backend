import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';

import dotenv from "dotenv";
dotenv.config();

import { CompletionInfo, UserInfo } from "./../Modals/modal.js";
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

// Function to generate a 4-digit OTP
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
        from: 'vedhamGPT@gmail.com',
        to: email,
        subject: 'OTP for Vedham',
        text: 'Welcome to Vedham. \nYour FOUR digit OTP : ' + otp
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

// checking the if the token has expired
router.get("/check_token", authenticateToken, (req, res) => {
    try {
        res.status(200).json({ status: "OK" })
    } catch (error) {
        res.status(401).send({ Error: error })
    }
})




// --------generation of caption-------

// predict image concepts(labels)
const predictImage = (inputs) => {
    try {


        return new Promise((resolve, reject) => {
            stub.PostModelOutputs(
                {
                    user_app_id: {
                        "user_id": "salesforce",
                        "app_id": "blip"
                    },
                    model_id: "general-english-image-caption-blip",
                    inputs: inputs
                },
                metadata,
                (err, response) => {
                    if (err) {
                        reject("Error:" + err);
                        return;
                    }

                    if (response.status.code !== 10000) {
                        reject("Received failed status: " + response.status.description + "\n" + response.status.details);
                        return;
                    }

                    const output = response.outputs[0].data.text.raw;

                    resolve(output)
                }
            );

        })
    } catch (error) {
        res.send({ Error: error.message })
    }
}


// generate a caption from labels
const openaiCaption = (caption, extraInfo) => {
    return new Promise((resolve, reject) => {

        openai.createCompletion({
            model: "text-davinci-003",
            prompt: `"${caption}" this string explains what is included in an image and ${extraInfo} and ignore the objects. create a short insta caption based on the string and also include 3 hashtags with 1 emoji and a bit of rhyming`,
            max_tokens: 300,
            temperature: 0.6,
        }).then((response) => {

            resolve(response.data.choices[0].text);
        }).catch(err => {
            reject(err)
        })
    })


}

// prompt 
router.post('/prompt', authenticateToken, async (req, res) => {
    try {
        const { imageURL, extraInfo, Qno } = req.body;

        const inputs = [
            {
                data: {
                    image: {
                        url: imageURL
                    }
                }
            }
        ]

        const resultCaption = await predictImage(inputs);
        const result = await openaiCaption(resultCaption, extraInfo);

        const d = new Date()
        const date = d.toISOString().split('T')[0];

        const user_id = req.user.user_id;
        const existingData = await CompletionInfo.findOne({ user_id, date });
        console.log(existingData)
        if (!existingData) {

            var data = await CompletionInfo.create({
                user_id,
                date: date,
                data: [
                    {
                        Qno,
                        imageURL,
                        inputText: extraInfo,
                        outputText: result
                    }
                ]
            });
        } else {
            data = await CompletionInfo.updateOne({ date, user_id }, {
                data: [
                    ...existingData.data,
                    {
                        Qno,
                        imageURL,
                        inputText: extraInfo,
                        outputText: result
                    }
                ]
            })
        }

        if (data) {

            return res.status(200).send({ status: "OK" })
        }

    } catch (error) {
        res.status(400).send({ Error: error })
    }
})





// ----------getting data from mongoDB------

router.get("/completions", authenticateToken, async (req, res) => {
    const user_id = req.user.user_id;

    const d = new Date()
    const date = d.toISOString().split('T')[0];
    try {


        const data_arr = await CompletionInfo.find({ user_id, date })
        if (data_arr) res.status(200).json(data_arr);

    } catch (error) {
        res.status(400).send({ Error: error })
    }
})



export default router;