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

    // Handle user login
    socket.on('login', async (name) => {
        try {
            const user = await getUserByUsername(name);
            if (user) {
                users[name] = socket.id;
                console.log(`${name} connected with socket ID: ${socket.id}`);
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    });
socket.on('privateMessage', async ({ to, from, message }) => {
    try {
        // Get user IDs
        const sender = await getUserByUsername(from);
        const receiver = await getUserByUsername(to);
        
        if (!sender || !receiver) {
            console.log('User not found');
            return;
        }

        // Save to database first
        const messageId = await saveMessage(
            sender.user_id,
            receiver.user_id,
            message
        );
        console.log('Message saved with ID:', messageId);

        // Then emit to recipients
        const toSocketId = users[to];
        if (toSocketId) {
            io.to(toSocketId).emit('privateMessage', { 
                from, 
                message,
                id: messageId,
                timestamp: new Date()
            });
        }

        // Also send back to sender
        const fromSocketId = users[from];
        if (fromSocketId) {
            io.to(fromSocketId).emit('privateMessage', {
                from: "You",
                message,
                id: messageId,
                timestamp: new Date()
            });
        }
    } catch (error) {
        console.error('Error handling private message:', error);
    }
});
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove user from connections
        for (const [name, id] of Object.entries(users)) {
            if (id === socket.id) {
                delete users[name];
                break;
            }
        }
    });
});


const PORT = process.env.PORT
server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
})
