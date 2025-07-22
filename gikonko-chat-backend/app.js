import express from "express";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import http from "http";
import { Server  } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
// import chatRoutes from "./chatRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import { saveMessage } from "./models/messageModel.js";
import messageRoutes from "./routes/messageRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import groupRoutes from "./routes/groupRoute.js"
import { getUserByName } from "./models/userModel.js";
import { setupNotificationService } from "./controllers/notificationController.js";
import NotificationRoutes from "./routes/notificationRoute.js";
import SettingRoute from "./routes/SettingRoutes.js";
// import { saveMessage } from "./models/messageModel.js";
import { fileURLToPath } from "url"; // convert file url to regural system path
import db from "./models/db.js"
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);


app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}));
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});


app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // avoid issue in paths, give access to your working directory 


const sessionMiddleware = (session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { // defines cookies stored in user's browser
        secure: false, // it is sent over http or https
        httpOnly: true, // helps to proctect against XSS
        sameSite: "lax" // prevent CSRF
     }
}));
app.use(sessionMiddleware);

// this allows to use Express middleware inside the socket.IO
// helps to take middleware and translate it to function for Socket.IO
const warp = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(warp(sessionMiddleware)); // tells the socket.IO to use session while user is connected via WebSocket

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/settings', SettingRoute);

// gives full absolute path of current file eg: /users/etiene/project/app.js
const __filename = fileURLToPath(import.meta.url);
// gets the only directory of the file
const __dirname = path.dirname(__filename);

app.use('/uploads/group', express.static(path.join(__dirname, 'uploads/group'))); // initialize group folder to be used in express
app.set('io', io); // set up socket.IO server

const users = {};

setupNotificationService(io, users);

io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);

    //handle joinGroup event
    socket.on('jojnGroup', (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`Socket ${socket.id} JOINED group_${groupId}`);
    })

 socket.on('deletePrivateMessage', ({ m_id }) => {
    io.emit('privateMessageDeleted', { m_id });
});

socket.on('deleteGroupMessage', ({ id }) => {
    io.emit('groupMessageDeleted', { id });
});
socket.on('login', async (username) => {
    try {
        const user = await getUserByName(username);
        if (user) {
            users[user.user_id] = socket.id;
            socket.user_id = user.user_id;
            socket.username = username;

            // join all groups 
            const [userGroups] = await db.query(
                "SELECT g_id FROM group_members WHERE user_id = ?",
                [user.user_id]
            );

            userGroups.forEach(g => socket.join(`group_${g.g_id}`));
            
            console.log(`${username} connected with socket ID: ${socket.id}`);
            io.emit('userList', Object.keys(users));
        }
    } catch (error) {
        console.error('Login error:', error);
    }
});

    
    socket.on('groupMessage', async ({ g_id, content, type = 'text'}) => {
        try {
            await db.query(
                'INSERT INTO group_message (user_id, type, content, is_read, created_at, g_id) VALUES(?, ?, ?, 0, NOW(), ?)',
                [socket.user_id, type, content, g_id]
            );

            const message = {
                g_id,
                user_id: socket.user_id,
                sender_name: socket.username,
                content,
                type,
                created_at: new Date().toISOString()
            };

            io.to(`group_${g_id}`).emit('newGroupMessage', message);

        } catch (err) {
            console.error('Failed to send group message via socket', err);
        }
    })

    socket.on('privateMessage', async ({ to, from, message }) => {
        try {
            const sender = await getUserByName(from);
            const receiver = await getUserByName(to);
            
            if (!sender || !receiver) {
                console.log('User not found');
                return;
            }

            await saveMessage(sender.user_id, receiver.user_id, message);

            const messageData = {
                    from,
                    to,
                    message,
                    timestamp: new Date()
            }
            // Deliver to recipient if online
            if (users[to]) {
                // io.to(users[to]).emit('privateMessage', messageData);
                io.to(users[to]).emit('unreadMessage', messageData); // new unread event
            }

            if (users[receiver.user_id]) {
                io.to(users[receiver.user_id]).emit('privateMessage', messageData);
            }

            socket.emit('privateMessage', {...messageData, from: 'You'});

        } catch (error) {
            console.error('Error handling private message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove user from connections
        for (const [username, id] of Object.entries(users)) {
            if (id === socket.id) {
                delete users[username];
                io.emit('userList', Object.keys(users));
                break;
            }
        }
    });
});

const PORT = process.env.PORT
server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
})
