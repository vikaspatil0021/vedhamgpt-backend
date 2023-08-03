# Vedham Backend - AI Image Caption Generator


Welcome to the backend repository of Vedham - an AI-powered Image Caption Generator. This backend complements the frontend part of the project and is responsible for handling API requests, processing images, and generating captions using ChatGPT API and Clarifai Image Caption Generation AI API.

## Project Overview

Vedham is a MERN (MongoDB, Express.js, React, Node.js) stack-based project that leverages AI capabilities to analyze images and produce descriptive captions. The frontend part of the application interacts with this backend to access the AI APIs and retrieve the captions for the provided images.

## Frontend Repository

To access the frontend part of the Vedham project, please visit: [Vedham Frontend Repository](https://github.com/vikaspatil0021/vedhamgpt)

## Technologies Used

The Vedham backend is developed using the following technologies:

- Node.js: A powerful JavaScript runtime for building scalable and efficient server-side applications.
- Express.js: A flexible and minimalist web application framework for Node.js that simplifies routing and middleware handling.
- MongoDB: A NoSQL database for storing image data and generated captions.
- ChatGPT API: An AI-based API for natural language processing and generating human-like text responses.
- Clarifai Image Caption Generation AI API: An AI API used for image recognition and caption generation based on image content.

## Live Demo

Check out the live demo of Vedham: [Vedham Live Demo](https://vedhamgpt.vercel.app/)

## Installation and Setup

To run the Vedham backend locally, follow these steps:

1. Clone the backend repository:

```bash
git clone https://github.com/vikaspatil0021/vedhamgpt-backend.git
```

2. Install dependencies:

```bash
cd vedhamgpt-backend
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory and add the necessary environment variables for ChatGPT API and Clarifai API.

```plaintext
MONGO_URL= ''
CLARIFAI_KEY= ''
OPENAI_KEY= ''
TOKEN_SECRET_KEY= ''

```

4. Start the server:

```bash
node server.js
```

The backend server will now be running locally, and it will be ready to handle API requests from the frontend.


## Get Involved

If you'd like to contribute to Vedham Backend or report any issues, feel free to submit a pull request or create an issue in the repository. Your contributions and feedback are highly appreciated.

## Contact

You can connect with me on LinkedIn: [Vikas Patil](https://www.linkedin.com/in/vikaspatil0021)

Let's build an incredible AI Image Caption Generator with Vedham! 🚀