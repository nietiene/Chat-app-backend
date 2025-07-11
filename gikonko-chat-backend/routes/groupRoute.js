import express from "express";
import { createGroup, getMyGroup } from "../controllers/groupController.js";
import { isAuthenticated } from "../controllers/auth.js";
import { getGroupMessages, sendGroupMessage } from "../controllers/groupController.js";
import { getCurrentUser } from "../controllers/userController.js";
import { getGroupInfo } from "../controllers/userController.js";
import db from "../models/db.js";

const router = express.Router();

router.post('/', isAuthenticated, createGroup);
router.get('/my', isAuthenticated, getMyGroup);
router.get('/me', isAuthenticated, getCurrentUser);
router.get('/:g_id', isAuthenticated, getGroupInfo);

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

router.delete('/group_members/:g_id/:user_id', async (req, res) => {
    const { g_id, user_id } = req.params;

    try {
        await db.query(
            'DELETE FROM group_members WHERE g_id = ? AND user_id = ?',
            [g_id, user_id]
        );
        res.json({ succes: true, message: 'Member removed from the group'});
    } catch (error) {
        console.error('Failed to remove goup', error);
        res.status(500).json({ error: 'Failed to remvoe member' });
    }
})

router.delete('/groups/group-messages/:id', async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.name;

    try {

        const [rows] = await db.query('SELECT user_id, g_id FROM group_message WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(494).json({ message: 'Message not found'});
        }

        const { user_id, g_id } = rows[0];

        const [memberRows] = await db.query('SELECT * FROM group_members WHERE g_id =? AND user_id = ?', [g_id, currentUser]);

        if (memberRows.length === 0) {
            return res.status(403).json({ message: 'Not a group member '});
        }

        if (user_id !== currentUser) {
            return res.status(403).json({ message: 'You can only delete your own message' });
        }
        
        const [result] = await db.query('DELETE FROM group_message WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message', error);
        res.status(500).json({ message: 'Server error' });
    }
})
export default router;