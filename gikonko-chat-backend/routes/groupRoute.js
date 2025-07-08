import express from "express";
import { createGroup, getMyGrouP } from "../controllers/groupController.js";
import { login } from "../controllers/authController.js";

const router = express.Router();