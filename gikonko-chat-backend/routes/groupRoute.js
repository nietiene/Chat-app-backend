import express from "express";
import { createGroup, getMyGroup } from "../controllers/groupController.js";
import { isAuthenticated } from "../controllers/auth.js";
import { getGroupMessages, sendGroupMessage } from "../controllers/groupController.js";
const router = express.Router();

router.post('/', isAuthenticated, createGroup);
router.get('/my', isAuthenticated, getMyGroup);

router.get('/group-messages/:g_id', isAuthenticated, getGroupMessages);
router.post('/group-messages', isAuthenticated, sendGroupMessage);

export default router;