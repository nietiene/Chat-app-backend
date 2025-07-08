import express from "express";
import { createGroup, getMyGroup } from "../controllers/groupController.js";
import { isAuthenticated } from "../controllers/auth.js";
import { getGroupMessages, sendGroupMessage } from "../controllers/groupController.js";
const router = express.Router();

router.post('/', isAuthenticated, createGroup);

router.get('/my', isAuthenticated, getMyGroup);

router.get('/group-messages/:g_id', getGroupMessages);

router.post('/group-messages', sendGroupMessage);

export default router;