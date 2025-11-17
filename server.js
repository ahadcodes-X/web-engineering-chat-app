const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3007;
// This is your public, online DB
const MONGO_URI = "mongodb+srv://ahadmakes_db_user:TntbwaLpabV2IuwV@cluster0.pfdbjga.mongodb.net/Chatly?retryWrites=true&w=majority";
const JWT_SECRET = 'your_super_secret_key_12345';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

const User = mongoose.model('User', UserSchema);

const MessageSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    message: { type: String, required: true },
    messageType: { type: String, default: 'text' },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = payload;
        next();
    });
};

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: 'Username and password required' });

        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing)
            return res.status(400).json({ message: 'Username already taken' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({ username: username.toLowerCase(), passwordHash });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: 'Username and password required' });

        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user)
            return res.status(400).json({ message: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ message: 'Login successful', token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

const onlineUsers = {};

app.get('/api/users/search', verifyToken, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.userId }
        })
        .limit(10)
        .select('username');

        res.json(users);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/friends/request', verifyToken, async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const sourceUserId = req.user.userId;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser)
            return res.status(404).json({ message: 'User not found' });

        if (targetUser.friends.includes(sourceUserId))
            return res.status(400).json({ message: 'Already friends' });

        if (targetUser.friendRequests.includes(sourceUserId))
            return res.status(400).json({ message: 'Request already sent' });

        targetUser.friendRequests.push(sourceUserId);
        await targetUser.save();

        const sourceUser = await User.findById(sourceUserId);
        const targetSocketId = onlineUsers[targetUser.username];

        if (targetSocketId) {
            io.to(targetSocketId).emit('new_friend_request', {
                from: sourceUser.username,
                _id: sourceUser._id
            });
        }

        res.json({ message: 'Friend request sent!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/friends', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('friends', 'username');

        const friends = user.friends.map(f => ({
            ...f.toJSON(),
            isOnline: !!onlineUsers[f.username]
        }));

        res.json(friends);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/friends/requests', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('friendRequests', 'username');
        res.json(user.friendRequests);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/friends/accept', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.body;

        const currentUserId = req.user.userId;
        const currentUser = await User.findById(currentUserId);
        const requestUser = await User.findById(requestId);

        if (!currentUser || !requestUser)
            return res.status(404).json({ message: 'User not found' });

        currentUser.friendRequests = currentUser.friendRequests.filter(
            id => id.toString() !== requestId
        );

        if (!currentUser.friends.includes(requestId))
            currentUser.friends.push(requestId);

        if (!requestUser.friends.includes(currentUserId))
            requestUser.friends.push(currentUserId);

        await currentUser.save();
        await requestUser.save();

        res.json({ message: 'Friend accepted!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/friends/reject', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.body;

        const currentUser = await User.findById(req.user.userId);
        currentUser.friendRequests = currentUser.friendRequests.filter(
            id => id.toString() !== requestId
        );

        await currentUser.save();

        res.json({ message: 'Friend request rejected' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('join', async (token) => {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            const { username } = payload;

            socket.username = username;
            onlineUsers[username] = socket.id;

            console.log(`✅ ${username} joined (${socket.id})`);
            socket.emit('join_success', { username });

            io.emit('online_users_update', Object.keys(onlineUsers));

        } catch (err) {
            socket.emit('auth_error');
            socket.disconnect();
        }
    });

    socket.on('private_message', async ({ to, message }) => {
        try {
            const from = socket.username;
            if (!from || !to || !message) return;

            const msg = new Message({ from, to, message });
            await msg.save();

            const targetSocketId = onlineUsers[to];
            if (targetSocketId) io.to(targetSocketId).emit('new_private_message', msg);

            socket.emit('new_private_message', msg);

        } catch (err) {
            console.error('Error sending private message:', err);
        }
    });

    socket.on('get_chat_history', async ({ withUser }) => {
        try {
            const messages = await Message.find({
                $or: [
                    { from: socket.username, to: withUser },
                    { from: withUser, to: socket.username }
                ]
            }).sort({ timestamp: 1 });

            socket.emit('chat_history', messages);

        } catch (err) {
            console.error('Error fetching chat:', err);
        }
    });

    socket.on('typing', ({ to }) => {
        const targetSocketId = onlineUsers[to];
        if (targetSocketId)
            io.to(targetSocketId).emit('user_typing', { from: socket.username });
    });

    socket.on('stop_typing', ({ to }) => {
        const targetSocketId = onlineUsers[to];
        if (targetSocketId)
            io.to(targetSocketId).emit('user_stop_typing', { from: socket.username });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete onlineUsers[socket.username];
            io.emit('online_users_update', Object.keys(onlineUsers));
        }

        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Now accessible on your network!`);
});
