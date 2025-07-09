import express from "express";
import { createGroup, getMyGroup } from "../controllers/groupController.js";
import { isAuthenticated } from "../controllers/auth.js";
import { getGroupMessages, sendGroupMessage } from "../controllers/groupController.js";
import db from "../models/db.js";

const router = express.Router();

router.post('/', isAuthenticated, createGroup);
router.get('/my', isAuthenticated, getMyGroup);

router.get('/group-messages/:g_id', isAuthenticated, getGroupMessages);
router.post('/:g_id/messages', isAuthenticated, sendGroupMessage);

router.get('/group_members/:g_id', async (req, res) => {
    const groupId = req.params.g_id;

    try {
        const [rows] = await db.query (
            `SELECT gm.user_id, u.name
            FROM group_members gm 
            JOIN user u ON u.user_id = gm.user_id
            WHERE gm.g_id = ?`,
            [groupId]
        );

        res.json(rows);
    } catch (error) {
        console.error("Error fetching group members", error);
        res.status(500).json({ error: 'Failed to fetch group members' });
    }
});

router.post('/group_members/:g_id', async (req, res) => {
    const groupId = req.params.g_id;
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'user_id required' })
    }
    try {
        const [user] = await db.query(
            `SELECT user_id FROM user WHERE phone = ?`,
            [phone]
        )
        if (!user.length) {
            return res.status(404).json({ eror: 'user not found' });
        }

        await db.query(
            `INSERT INTO group_members (g_id, user_id, joined_at)
            VALUES(?, ?, NOW())`,
            [groupId, user[0].user_id]
        );

        res.json({ succes: true, message: 'Member added to gorup' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add meber to group' });
    }
})
export default router;