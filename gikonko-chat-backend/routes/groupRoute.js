import express from "express";
import { createGroup, getMyGroup } from "../controllers/groupController.js";
import { isAuthenticated } from "../controllers/auth.js";
const router = express.Router();

router.post('/', isAuthenticated, createGroup);

router.get('/my', isAuthenticated, getMyGroup);

export default router;