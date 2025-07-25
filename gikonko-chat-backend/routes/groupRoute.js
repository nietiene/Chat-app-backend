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

//adding user to the group

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
            AND (left_at IS NULL AND is_leaved = FALSE)`,
            [groupId, userId]
        )

        if (existingMember.length > 0) {
            return res.status(400).json({
                error: 'User is already a member of this group'
            })
        }

        // check if user was previous member (was already a member) to update instead of insert
        const [previousMember] = await db.query(
            `SELECT * FROM group_members
            WHERE g_id = ? AND user_id = ?`,
            [groupId, userId]
        );
  
        if (previousMember.length > 0) {
            //update existing record
            await db.query(
                `UPDATE group_members
                SET joined_at = NOW(), left_at = NULL, is_leaved = FALSE
                WHERE g_id = ? AND user_id = ?`,
            [groupId, userId]);
        } else {

            await db.query(
            `INSERT INTO group_members (g_id, user_id, joined_at)
            VALUES(?, ?, NOW())`,
            [groupId, userId]
        );
        }

        res.json({ success: true, message: 'Member added to gorup' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add meber to group' });
    }
})

// leaving to the group
router.delete('/group_members/:g_id/:user_id', async (req, res) => {
    const { g_id, user_id } = req.params;

    try {
        await db.query(
            'DELETE FROM group_members WHERE g_id = ? AND user_id = ?',
            [g_id, user_id]
        );
        res.json({ succes: true, message: 'Member removed from the group'});
    } catch (error) {
        console.error('Failed to remove group', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
})

router.delete('/group-messages/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.session.user.id;

    try {
        const [messageRows] = await db.query('SELECT user_id, g_id FROM group_messages WHERE id = ?', [id]);

        if (messageRows.length === 0) {
            return res.status(404).json({ message: 'Message not found'});
        }

        // this line is destructor assignment
        const { g_id: groupId, user_id: messageOwnerId } = messageRows[0];

        // check if current logged in user is member of the group
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

    // sends event to the connected group members that message was deleted this helps the frontend to remove message in real time of the screen
    req.app.get('io').emit('groupMessageDeleted', { id });
    
    res.json({ message: 'Message deleted successfully' });
  
  } catch (error) {
      console.error('Error deleting message', error);
      res.status(500).json({ message: 'Server error'});
    }

})

router.delete('/leave/:g_id', isAuthenticated, async (req, res) => {
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

router.patch('/:g_id/soft-delete', isAuthenticated, async (req, res) => {
    const{ g_id } = req.params;
    const userId = req.session.user.id;

    try {
        // check if the group is exist
        const [rows] = await db.query('SELECT created_by FROM groups WHERE g_id = ? AND is_deleted = 0', [g_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Group not found or already deleted' })
        }

        // check if logged in user is admin or group creator
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

router.patch('/rename/:g_id/name', async (req, res) => {
    
    const { g_id } = req.params;
    const { group_name } = req.body;
    const user_id = req.session.user.id;

    if (!group_name || !group_name.trim()) {
        return res.status(400).json({ message: 'Group name required' });
    }

    try {
        const [group] = await db.query (
            'SELECT * FROM groups WHERE  g_id = ? AND is_deleted = 0',
            [g_id]

        );

        if (!group.length) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group[0].created_by !== user_id) {
            return res.status(403).json({ message: 'Unauthorized: not a group creator' });
        }

        await db.query(
            'UPDATE groups SET group_name = ? WHERE g_id = ?',
            [group_name.trim(), g_id]
        );

        res.json({ message: 'Group name updated successfully' });
    
    } catch (err) {
        console.error('Error updating group name:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
})


//for handling changing of group photo
import multer from "multer"; // middleware for handling multipart data(uploading files);
import fs from "fs";

// ensure upload folder is exists
const uploadDir = 'uploads/group';
if (!fs.existsSync(uploadDir)) { // check is not folder exist
    fs.mkdirSync(uploadDir, { recursive: true }); // if is true it create it recursive means create folder if parent folder exist means if only uploads folder exist
}

const storage = multer.diskStorage({ // this methods helps to tell multer how to store files

    destination: (req, file, cb) => cb(null, uploadDir), // tells mukter where to save files

    filename: (req, file, cb) => {
        // here it takes original name and replace with - depend on timestamp to avoid conflict
        const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-'); 
        cb(null, safeName)
       }
});

const upload = multer({ storage });

router.patch('/change-group-photo/:g_id/photo', isAuthenticated, upload.single('photo'), async (req, res) => {
    // upload.single() -> handles single file upload
    const { g_id } = req.params;
    const userId = req.session.user.id;

    try {
        const [rows] = await db.query('SELECT * FROM groups WHERE g_id = ? AND is_deleted = 0', [g_id]);

        if (!rows.length) {
            res.status(404).json({ message: 'Group not found' });

        }

        const group = rows[0];
        if (group.created_by !== userId) {
            return res.status(401).json({ message: 'Forbidden: not a group creator' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded' });
        }

        // save a new photo path
        const photoPath = `/uploads/group/${req.file.filename}`;
        await db.query('UPDATE groups SET group_photo = ? WHERE g_id = ?', [photoPath, g_id]);

        res.json({ message: 'Group photo updated', photoPath});
    
    } catch (error) {
        console.error('Failed to update group photo', error);
        res.status(500).json({ message: 'Server error' });
    }
})
export default router;