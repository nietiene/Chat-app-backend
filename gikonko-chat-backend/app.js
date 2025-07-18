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
import NotificationRoutes from "./routes/notificationRoute.js";
import { fileURLToPath } from "url";
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
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


const sessionMiddleware = (session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        sameSite: "lax"
     }
}));
app.use(sessionMiddleware);

const warp = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(warp(sessionMiddleware));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', NotificationRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads/group', express.static(path.join(__dirname, 'uploads/group')));
app.set('io', io);

const users = {};

io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);

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
            console.log(`${username} connected with socket ID: ${socket.id}`);
            io.emit('userList', Object.keys(users));
        }
    } catch (error) {
        console.error('Login error:', error);
    }
});

    
    const userInGroup = socket.request.session.user;
    if (!userInGroup) return;

    socket.user_id = userInGroup.user_id;

    const [userGroup] = await db.query(
        `SELECT g_id FROM group_members WHERE user_id = ?`,
        [userInGroup.user_id]
    );
    userGroup.forEach(g => socket.join(`group_${g.g_id}`));

    socket.on('groupMessage', async ({ g_id, content, type = 'text'}) => {
        try {
            await db.query(
                'INSERT INTO group_message (user_id, type, content, is_read, created_at, g_id) VALUES(?, ?, ?, 0, NOW(), ?))',
                [socket.user_id, type, content, g_id]
            );

            io.to(`group_${g_id}`).emit('newGroupMessage', {
                g_id,
                user_id: socket.user_id,
                sender_name: userInGroup.name,
                content,
                type,
                created_at: new Date().toISOString()
            });
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

            const messageData = {
                    from,
                    message,
                    timestamp: new Date()
            }
            // Deliver to recipient if online
            if (users[to]) {
                io.to(users[to]).emit('privateMessage', messageData);
                io.to(users[to]).emit('unreadMessage', messageData); // new unread event
            }

            // Send confirmation back to sender
            socket.emit('privateMessage', {
                from: 'You',
                message,
                timestamp: new Date()
            });

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
