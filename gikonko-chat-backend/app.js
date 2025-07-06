import express from "express";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
// import chatRoutes from "./chatRoutes.js";
// import postRoutes from "./postRoutes.js";
import { saveMessage } from "./models/messageModel.js";
import { getUserIdByUsername } from "./models/userModel.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
// app.use("/uploads", express.static("uploads"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use("/api/auth", authRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/posts', postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

const users = {};

io.on("connection", (socket) => {
  console.log("A User connected", socket.id);

  socket.on("login", ({ name, id }) => {
    if (!name || !id) return;

    // Store socket.id keyed by username for messaging
    users[name] = socket.id;

    // Optional: store username/id on socket for disconnect cleanup
    socket.username = name;
    socket.userId = id;

    io.emit("userList", Object.keys(users));
  });

  socket.on("privateMessage", async ({ to, from, message }) => {
    try {
      const sender_id = await getUserIdByUsername(from);
      const receiver_id = await getUserIdByUsername(to);

      await saveMessage(sender_id, receiver_id, message);

      const toTargetSocketId = users[to];
      if (toTargetSocketId) {
        io.to(toTargetSocketId).emit("privateMessage", { from, message });
      }
    } catch (error) {
      console.error("Failed to save message", error);
    }
  });

  socket.on("typing", ({ to }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("typing");
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("stopTyping");
    }
  });

  socket.on("disconnect", () => {
    // Remove user from list on disconnect
    for (const username in users) {
      if (users[username] === socket.id) {
        delete users[username];
        io.emit("userList", Object.keys(users));
        break;
      }
    }
    console.log("User disconnected", socket.id);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
