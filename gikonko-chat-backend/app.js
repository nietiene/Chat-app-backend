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

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        sameSite: "lax"
     }
}));

app.use('/api/auth', authRoutes);
// app.use('/api/chat', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const users = {};
// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Store user socket connections
    const users = {};

    // Handle user login
    socket.on('login', async (username) => {
        try {
            const user = await getUserByUsername(username);
            if (user) {
                users[username] = socket.id;
                console.log(`${username} connected with socket ID: ${socket.id}`);
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    });

    // Handle private messages
    socket.on('privateMessage', async ({ to, from, message }) => {
        try {
            // Get user IDs
            const sender = await getUserByUsername(from);
            const receiver = await getUserByUsername(to);
            
            if (!sender || !receiver) {
                return;
            }

            // Save message to database
            const messageId = await saveMessage(
                sender.user_id,
                receiver.user_id,
                message
            );

            // Emit to receiver if online
            if (users[to]) {
                io.to(users[to]).emit('privateMessage', {
                    from,
                    message,
                    timestamp: new Date()
                });
            }

            // Emit back to sender for their own UI
            socket.emit('privateMessage', {
                from: 'You',
                message,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error handling private message:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove user from connections
        for (const [username, id] of Object.entries(users)) {
            if (id === socket.id) {
                delete users[username];
                break;
            }
        }
    });
});


const PORT = process.env.PORT
server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
})
