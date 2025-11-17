# Web Engineering Chat App

A real-time chat application built for a Web Engineering class project. Users can register, log in, search for other users, send friend requests, and chat in real-time.






## 🚀 Features

* **User Authentication:** Secure user registration and login using JWT (JSON Web Tokens) and password hashing with bcrypt.
* **Friend System:** Users can search for other users, send friend requests, and accept or reject pending requests.
* **Real-time Chat:** Instant messaging powered by Socket.io, sent to specific online users.
* **Chat History:** All messages are saved to MongoDB and loaded when a chat is opened.
* **Online Status:** Friends list displays which users are currently online.
* **Typing Indicators:** Users can see when their chat partner is typing a message.

## 🛠️ Tech Stack

### Backend
* **[Node.js](https://nodejs.org/)** - JavaScript runtime environment
* **[Express](https://expressjs.com/)** - Web framework for Node.js
* **[Socket.io](https://socket.io/)** - For real-time, bi-directional event-based communication
* **[MongoDB](https://www.mongodb.com/)** - NoSQL database
* **[Mongoose](https://mongoosejs.com/)** - Object Data Modeling (ODM) library for MongoDB
* **[JSON Web Token (JWT)](https://jwt.io/)** - For secure user authorization
* **[bcrypt.js](https://www.npmjs.com/package/bcryptjs)** - For password hashing

### Frontend
* **HTML5**
* **CSS3**
* **Vanilla JavaScript (ES6+)**

---

## 🔧 Getting Started

How to get a local copy up and running.

### Prerequisites

You must have [Node.js](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/get-npm) installed on your computer.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/ahadcodes-X/web-engineering-chat-app.git](https://github.com/ahadcodes-X/web-engineering-chat-app.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd web-engineering-chat-app
    ```
3.  **Install backend dependencies:**
    ```sh
    npm install
    ```
    (This will install `express`, `mongoose`, `socket.io`, etc.)

4.  **Set up Environment Variables:**
    Your server code (`server.js`) looks for a `MONGO_URI` and a `JWT_SECRET`. It's best to put these in a `.env` file.
    * Create a file named `.env` in the root of the project.
    * Add the following to it (replacing with your values):

    ```
    MONGO_URI="mongodb+srv://ahadmakes_db_user:TntbwaLpabV2IuwV@cluster0.pfdbjga.mongodb.net/Chatly?retryWrites=true&w=majority"
    JWT_SECRET="your_super_secret_key_12345"
    ```
    * **IMPORTANT:** You must add `.env` to your `.gitignore` file so you don't push your secret database keys to GitHub!

### Running the Application

1.  **Start the server:**
    ```sh
    node server.js
    ```
2.  Your server should now be running on `http://localhost:3007`.

3.  **Open the app in your browser:**
    Go to [http://localhost:3007](http://localhost:3007)
    (The server is set up to automatically serve the `index.html` file from your `public` folder.)