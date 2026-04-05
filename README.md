# 💬 Chatty Chat — Real-Time Chat Application

A full-stack WhatsApp-style real-time chat app built with React, Node.js, Socket.io, and MongoDB.

---
For testing application use

email: ishraq2@gmailcom
password: 1234567

email: haram@gmail.com
password: haram123

OR Register your Account first ;)

## Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | React.js, Axios, Socket.io-client, React Router |
| Backend    | Node.js, Express.js, Socket.io            |
| Database   | MongoDB + Mongoose                        |
| Auth       | JWT + bcryptjs                            |
| Styling    | Custom CSS (WhatsApp dark theme)          |

---

## Project Structure

```
chatty-chat/
├── server/                   ← Node.js backend
│   ├── config/db.js          ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── messageController.js
│   ├── middleware/
│   │   └── authMiddleware.js ← JWT protection
│   ├── models/
│   │   ├── User.js           ← User schema
│   │   └── Message.js        ← Message schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── messageRoutes.js
│   ├── socket/
│   │   └── socket.js         ← All Socket.io logic
│   ├── .env                  ← Environment variables
│   └── server.js             ← Entry point
│
└── client/                   ← React frontend
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js ← Global auth state
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── Chat.js       ← Main chat layout
    │   ├── components/
    │   │   ├── Sidebar.js    ← User list
    │   │   ├── ChatBox.js    ← Chat window
    │   │   └── MessageBubble.js
    │   ├── hooks/
    │   │   └── useSocket.js
    │   ├── socket.js          ← Socket singleton
    │   ├── App.js             ← Router + protected routes
    │   └── index.js
    └── .env
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 1. Clone / Download the project

```bash
cd chatty-chat
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatty-chat
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

Start server:
```bash
npm run dev      # Development (nodemon)
npm start        # Production
```

---

### 3. Frontend Setup

```bash
cd client
npm install
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start frontend:
```bash
npm start
```

---

### 4. Open in Browser

```
http://localhost:3000
```

Register two accounts in different tabs and start chatting in real time!

---

## 🔌 Socket.io Events

| Event           | Direction       | Description                          |
|-----------------|-----------------|--------------------------------------|
| `addUser`       | Client → Server | Register user as online               |
| `getUsers`      | Server → Client | Broadcast updated online user list    |
| `sendMessage`   | Client → Server | Send a message                        |
| `receiveMessage`| Server → Client | Deliver message to recipient          |
| `messageSent`   | Server → Client | Confirm sent message back to sender   |
| `typing`        | Client → Server | User started typing                   |
| `stopTyping`    | Client → Server | User stopped typing                   |
| `userTyping`    | Server → Client | Forward typing to recipient           |
| `userStopTyping`| Server → Client | Forward stop-typing to recipient      |
| `markRead`      | Client → Server | Mark messages as read                 |
| `messagesRead`  | Server → Client | Notify sender messages were read      |

---

##  API Endpoints

### Auth
| Method | Endpoint              | Description            | Auth Required |
|--------|-----------------------|------------------------|---------------|
| POST   | `/api/auth/register`  | Register new user      | No            |
| POST   | `/api/auth/login`     | Login user             | No            |
| GET    | `/api/auth/me`        | Get current user       | Yes           |
| POST   | `/api/auth/logout`    | Logout user            | Yes           |

### Messages
| Method | Endpoint                        | Description                  | Auth Required |
|--------|---------------------------------|------------------------------|---------------|
| GET    | `/api/messages/users`           | Get all users for sidebar    | Yes           |
| GET    | `/api/messages/:receiverId`     | Get conversation history     | Yes           |
| POST   | `/api/messages/send/:receiverId`| Send message (REST fallback) | Yes           |
| DELETE | `/api/messages/:messageId`      | Delete message (soft delete) | Yes           |

---

##  Features

- ✅ JWT Authentication (Register / Login / Logout)
- ✅ Real-time messaging via Socket.io
- ✅ Message read receipts (single tick → double tick → blue ticks)
- ✅ Typing indicators
- ✅ Online / Offline status
- ✅ Chat history stored in MongoDB
- ✅ Last message preview in sidebar
- ✅ Unread message badge count
- ✅ Dark WhatsApp-style UI
- ✅ Responsive design
- ✅ Skeleton loading states
- ✅ Soft delete messages

---

##  Future Enhancements

- [ ] Image / file sharing
- [ ] Group chats
- [ ] Voice messages
- [ ] Push notifications
- [ ] Message reactions (emoji)
- [ ] User profile editing
- [ ] Message search
- [ ] End-to-end encryption

---
Challenges Faced

During the development of this project, I faced several challenges:

1. Socket Connection Handling

Managing real-time user connections and tracking online users using socket IDs was complex, especially when users disconnected unexpectedly.

2. Authentication Issues

Handling JWT authentication between frontend and backend required careful token management and debugging login failures.

3. MongoDB Data Sync

Ensuring messages were properly stored and retrieved in correct order required multiple schema adjustments and testing.

4. React State Management

Keeping chat UI updated in real-time without refreshing the page required proper use of useEffect and socket listeners.

5. Deployment & Git Issues

Faced issues with Git push conflicts and repository synchronization, which required learning proper git pull/push workflow.
