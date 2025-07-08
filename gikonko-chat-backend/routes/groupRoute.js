import express from "express";
import { createGroup, getMyGroup } from "../controllers/groupController.js";
import { login } from "../controllers/authController.js";

const router = express.Router();

router.post('/', login, createGroup);

router.get('/my', login, getMyGroup);

export default router;