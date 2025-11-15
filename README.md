A full-stack, real-time chat application built with Node.js, Express, Socket.io, and MongoDB. This project features a complete user authentication system, a friend request system, and private, end-to-end encrypted messaging.

Features

User Authentication: Secure user registration and login with JWT (JSON Web Tokens).

Password Hashing: Passwords are securely hashed using bcrypt.js.

Real-Time Messaging: Live, private messaging between users using Socket.io.

End-to-End Encryption: Messages are encrypted on the client-side with CryptoJS before being sent to the server.

Friend System:

Search for other users in real-time.

Send and receive friend requests.

Accept or reject pending requests.

Online Presence: See which of your friends are currently online.

Chat History: All message history is saved to MongoDB and loaded when you open a chat.

Typing Indicators: See when your friend is typing a message in real-time.

Responsive Frontend: A clean, responsive UI built with vanilla HTML, CSS, and JavaScript.

Technology Stack

Backend :

Node.js - JavaScript runtime

Express - Web framework for Node.js

Socket.io - For real-time, bidirectional communication

MongoDB - NoSQL database

Mongoose - Object Data Modeling (ODM) for MongoDB

JSON Web Tokens (JWT) - For securing user auth
rontend

HTML5

CSS3 (with custom properties, animations, and a glassmorphism design)

Vanilla JavaScript (ES6+) - For all client-side logic

CryptoJS - For client-side message encryption

How to Run

Follow these steps to get the project running on your local machine.

1. Prerequisites

Node.js (v14 or later)

MongoDB (You can use a free cluster on MongoDB Atlas)

2. Clone the Repository

git clone [https://github.com/ahadcodes-X/web-engineering-chat-app.git](https://github.com/ahadcodes-X/web-engineering-chat-app.git)
cd web-engineering-chat-app


3. Install Dependencies

This will install all the required packages from package.json.

npm install


4. Configure Environment

Open server.js and update the following variables with your own values:

// Your MongoDB connection string
const MONGO_URI = "mongodb+srv://<user>:<password>@cluster.mongodb.net/YourDB?retryWrites=true&w=majority";

// Your secret key for signing JWTs
const JWT_SECRET = 'your_own_super_secret_key_12345';


5. Run the Server

node server.js


The server should now be running!

6. Open the App

Open your browser and navigate to http://localhost:3007.

This project was built for a Web Engineering course.
