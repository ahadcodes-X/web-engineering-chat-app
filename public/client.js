// client.js (Reverted to no avatars, but WITH the fix)
const socket = io();
const SECRET_KEY = "my-super-secret-key-123"; // E2EE Key

// --- DOM Elements ---
const friendList = document.getElementById('friend-list');
const messageArea = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatTargetSpan = document.getElementById('chatting-with');
const typingIndicator = document.getElementById('typing-indicator');
const logoutButton = document.getElementById('logout-button');
const searchInput = document.getElementById('user-search-input');
const searchResults = document.getElementById('search-results');
const requestsButton = document.getElementById('requests-button');
const requestsModal = document.getElementById('requests-modal');
const requestsList = document.getElementById('requests-list');
const closeModalButton = document.getElementById('close-modal-button');

// --- AUTH ---
const token = localStorage.getItem('chat_token');
if (!token) window.location.href = '/'; 

let currentChatTarget = null;
let myUsername = null;
let friends = [];
let onlineUsers = [];

socket.emit('join', token);

socket.on('join_success', ({ username }) => { 
    myUsername = username;
    loadFriendsList();
});

socket.on('auth_error', () => {
    console.error('Authentication failed. Redirecting to login.');
    localStorage.removeItem('chat_token');
    window.location.href = '/';
});

// --- FRIEND LIST ---
async function loadFriendsList() {
    try {
        const res = await fetch('/api/friends', { headers: { 'Authorization': `Bearer ${token}` } });
        friends = await res.json();
        renderFriendsList();
    } catch (e) {}
}

function renderFriendsList() {
    friendList.innerHTML = '';
    
    friends.sort((a, b) => {
        const aOnline = onlineUsers.includes(a.username);
        const bOnline = onlineUsers.includes(b.username);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return a.username.localeCompare(b.username);
    });

    friends.forEach(friend => {
        const isOnline = onlineUsers.includes(friend.username);
        const li = document.createElement('li');
        
        li.dataset.username = friend.username;
        li.innerHTML = `
            <span>${friend.username}</span>
            <span class="status-dot ${isOnline ? 'online' : ''}"></span>
        `;
        
        li.addEventListener('click', () => {
            selectUserForChat(friend.username); 
            document.querySelectorAll('#friend-list li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
        });
        
        if (friend.username === currentChatTarget) li.classList.add('active');
        friendList.appendChild(li);
    });
}

socket.on('online_users_update', (users) => {
    onlineUsers = users;
    renderFriendsList(); 
});

// --- CHAT ---
function selectUserForChat(username) { 
    currentChatTarget = username;
    chatTargetSpan.textContent = username;
    
    messageArea.innerHTML = ''; 
    chatForm.style.display = 'flex'; 
    messageInput.focus();
    socket.emit('get_chat_history', { withUser: username });
}

socket.on('chat_history', (messages) => {
    if (!currentChatTarget) return;
    messageArea.innerHTML = `<div class="message system">This is the start of your chat history with ${currentChatTarget}.</div>`;
    messages.forEach(msg => {
        const type = msg.from === myUsername ? 'sent' : 'received';
        appendMessage(msg.from, msg.message, type, msg.timestamp); 
    });
    messageArea.scrollTop = messageArea.scrollHeight;
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (!message.trim() || !currentChatTarget) return;

    let encrypted = message;
    if (typeof CryptoJS !== 'undefined') {
        encrypted = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
    }

    socket.emit('private_message', { 
        to: currentChatTarget, 
        message: encrypted 
    });
    
    messageInput.value = '';
    clearTimeout(typingTimeout);
    socket.emit('stop_typing', { to: currentChatTarget });
});

socket.on('new_private_message', (msg) => {
    const { from, to, message, timestamp } = msg;
    if ((from === myUsername && to === currentChatTarget) || (from === currentChatTarget && to === myUsername)) {
        const type = (from === myUsername) ? 'sent' : 'received';
        appendMessage(from, message, type, timestamp); 
    } else {
        const friendLi = document.querySelector(`#friend-list li[data-username="${from}"]`);
        if (friendLi) {
            friendLi.classList.add('unread');
        }
    }
});


// --- THIS IS THE FIX YOU ASKED FOR ---
function appendMessage(sender, message, type, timestamp) { 
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);

    let decrypted = message;
    if (typeof CryptoJS !== 'undefined') {
        try {
            const bytes = CryptoJS.AES.decrypt(message, SECRET_KEY);
            const str = bytes.toString(CryptoJS.enc.Utf8);
            if (str) decrypted = str;
        } catch (e) {} // Failsafe
    }
    
    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let messageContent = `<p>${decrypted}</p>`;

    if (type === 'system') {
        msgDiv.innerHTML = `<p>${decrypted}</p>`;
    } else {
        // The <strong> tag that showed "You" and "batman" is GONE.
        msgDiv.innerHTML = `
            ${messageContent}
            <span class="timestamp">${time}</span>
        `;
    }
    
    messageArea.appendChild(msgDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}
// --- END OF FIX ---


// --- Typing Indicators ---
let typingTimeout;
messageInput.addEventListener('keydown', () => {
    if (!currentChatTarget) return;
    socket.emit('typing', { to: currentChatTarget });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop_typing', { to: currentChatTarget });
    }, 2000);
});

socket.on('user_typing', ({ from }) => {
    if (from === currentChatTarget) {
        typingIndicator.textContent = `${from} is typing...`;
        typingIndicator.classList.add('visible');
    }
});

socket.on('user_stop_typing', ({ from }) => {
    if (from === currentChatTarget) {
        typingIndicator.classList.remove('visible');
    }
});


// --- Friend Search ---
let searchDebounce;
searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const query = searchInput.value;
    if (!query) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }
    searchDebounce = setTimeout(async () => {
        try {
            const res = await fetch(`/api/users/search?query=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await res.json();
            renderSearchResults(users);
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300); 
});

function renderSearchResults(users) {
    searchResults.innerHTML = '';
    if (users.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    
    const friendUsernames = friends.map(f => f.username);
    const nonFriends = users.filter(u => !friendUsernames.includes(u.username) && u.username !== myUsername);

    nonFriends.forEach(user => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <span>${user.username}</span>
            <button data-id="${user._id}">Add</button>
        `;
        item.querySelector('button').addEventListener('click', () => sendFriendRequest(user._id));
        searchResults.appendChild(item);
    });
    searchResults.style.display = 'block';
}

async function sendFriendRequest(targetUserId) {
    try {
        const res = await fetch('/api/friends/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetUserId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        alert('Friend request sent!');
        searchInput.value = '';
        searchResults.style.display = 'none';
    } catch (error) {
        alert(error.message);
    }
}
document.addEventListener('click', (e) => {
    if (searchResults && !searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.style.display = 'none';
    }
});


// --- Friend Requests Modal ---
requestsButton.addEventListener('click', () => {
    requestsModal.style.display = 'flex';
    loadFriendRequests();
});

closeModalButton.addEventListener('click', () => {
    requestsModal.style.display = 'none';
});

async function loadFriendRequests() {
    try {
        const res = await fetch('/api/friends/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await res.json();
        
        requestsList.innerHTML = ''; 
        requestsButton.textContent = `Requests (${requests.length})`; 
        if(requests.length > 0) {
            requestsButton.classList.add('pulsing');
        } else {
            requestsButton.classList.remove('pulsing');
        }

        if (requests.length === 0) {
            requestsList.innerHTML = '<li>No new requests.</li>';
            return;
        }

        requests.forEach(req => {
            const li = document.createElement('li');
            li.className = 'request-item';
            li.innerHTML = `
                <span>${req.username}</span>
                <div class="request-item-buttons">
                    <button class="accept-btn" data-id="${req._id}">Accept</button>
                    <button class="reject-btn" data-id="${req._id}">Reject</button>
                </div>
            `;
            requestsList.appendChild(li);
        });

        document.querySelectorAll('.accept-btn').forEach(btn => btn.addEventListener('click', () => acceptRequest(btn.dataset.id)));
        document.querySelectorAll('.reject-btn').forEach(btn => btn.addEventListener('click', () => rejectRequest(btn.dataset.id)));

    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

async function acceptRequest(requestId) {
    await handleRequest('/api/friends/accept', requestId, 'Friend accepted!');
    loadFriendsList(); 
}

async function rejectRequest(requestId) {
    await handleRequest('/api/friends/reject', requestId, 'Request rejected.');
}

async function handleRequest(endpoint, requestId, successMessage) {
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ requestId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        alert(successMessage);
        loadFriendRequests(); 
    } catch (error) {
        alert(error.message);
    }
}

socket.on('new_friend_request', () => {
    alert(`You have a new friend request!`);
    loadFriendRequests(); 
});


// --- LOGOUT LOGIC ---
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('chat_token');
    window.location.href = '/'; 
});