import express from "express";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import http from "http";
import { Server  } from "socket.io";
import authRoutes from "./authRoutes.js";
import chatRoutes from "./chatRoutes.js";
import postRoutes from "./postRoutes.js";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/posts', postRoutes);

const users = {};

io.on('connection', (socket) => {
    console.log("A User connected", socket.id);

    socket.on("login", (username) => {
        users[username] = socket.id;
        io.emit("userList", Object.keys(users));
    });

    socket.on("privateMessage", ({ to, message }) => {
        const toTargetSocketId = users[to];
        if (toTargetSocketId) {
            io.to(toTargetSocketId).emit("privateMessage", { from, message })
        }
    })

    socket.on("disconnect", () => {
        for (const username in users) {
            if (users[username] = users[to]) {
                
            }
        }
    })
});
