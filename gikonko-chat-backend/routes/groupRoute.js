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
            WHERE gm.g_id = ? 
            AND gm.left_at IS NULL
            AND (gm.is_leaved IS NULL OR gm.is_leaved = FALSE)`,
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

        const userId = user[0].user_id;

        //check if user already active member
        const [existingMember] = await db.query(
            `SELECT * FROM group_members
            WHERE g_id = ? AND user_id = ?
            AND (left_at IS NULL OR AND is_leaved = FALSE)`,
            [groupId, userId]
        )

        if (existingMember.length > 0) {
            return res.json(400).json({
                error: 'User is already a member of this group'
            })
        }

        // check if user was previous member to update instead of insert
        const [previousMember] = await db.query(
            `SELECT * FROM group_members
            WHERE g_id = ? AND user_id = ?`,
            [groupId, userId]
        );

        
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

router.delete('/group-messages/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.session.user.id;

    console.log(`Delete request: User ${currentUserId} deleting message ${id}`);

    try {
        const [messageRows] = await db.query('SELECT user_id, g_id FROM group_messages WHERE id = ?', [id]);

        if (messageRows.length === 0) {
            return res.status(404).json({ message: 'Message not found'});
        }

        const { g_id: groupId, user_id: messageOwnerId } = messageRows[0];

        const [memberRows] = await db.query(
            'SELECT * FROM group_members WHERE g_id = ? AND user_id = ?',
            [groupId, currentUserId]
        );

        if (memberRows.length === 0) {
            return res.status(403).json({ message: 'Not a group member' });
        }
       if (messageOwnerId !== currentUserId) {
        return res.status(403).json({ message: 'You can only delete your message' });
    }

    await db.query('UPDATE group_messages SET is_deleted = TRUE WHERE id = ?', [id]);

    req.app.get('io').emit('groupMessageDeleted', { id });
    
    res.json({ message: 'Message deleted successfully' });
  
  } catch (error) {
      console.error('Error deleting message', error);
      res.status(500).json({ message: 'Server error'});
    }

})

router.delete('/leave/:g_id', async (req, res) => {
    const user_id = req.session.user.id;
    const g_id = req.params.g_id;

    try {
        await db.query(
            'UPDATE group_members SET left_at = NOW(), is_leaved = TRUE WHERE user_id = ? AND g_id = ?', [user_id, g_id]
        );
        res.json({ message: 'Left group successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error leaving group' });
    }
})

router.patch('/:g_id/soft-delete', async (req, res) => {
    const{ g_id } = req.params;
    const userId = req.session.user.id;

    try {
        const [rows] = await db.query('SELECT created_by FROM groups WHERE g_id = ? AND is_deleted = 0', [g_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Group not found or already deleted' })
        }

        if (rows[0].created_by !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete the group' });
        }

        await db.query('UPDATE groups SET is_deleted = 1 WHERE g_id = ?', [g_id]);

        res.json({ succes: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error in deleting soft delete', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

export default router;