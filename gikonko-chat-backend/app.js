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
const io = new Server(server);
