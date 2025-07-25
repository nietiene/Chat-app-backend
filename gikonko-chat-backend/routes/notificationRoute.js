import express from "express";
import pool from "../models/db.js";
import { sendNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get('/notification', sendNotification);

router.get('/', async (req, res) => {

    try {

        const userId = req.session.user.id;

        const [rows] = await pool.query(
            // LEFT JOIN returns mathcing rows if sender_id and notification_id is match else if sender_id is not availablr it returns only the notification columns but some column of user will bbe null
            `SELECT n.*, u.name AS sender_name, u.profile_image AS sender_profile_image
            FROM notifications n
            LEFT JOIN user u ON n.sender_id = u.user_id
            WHERE n.receiver_id = ?
            ORDER BY n.created_at DESC`,
            [userId]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json('Error fetching notifications');
    }
})


// Mark as readed
router.post('/mark-read', async (req, res) => {

    try {
        const userId = req.session.user.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        await pool.query (
            'UPDATE notifications SET is_read = 1 WHERE receiver_id = ?',
            [userId]
        );

        return res.status(200).json({ message: 'Marked as read' });

    } catch (error) {
       res.status(500).json('Error marking notification as read')
    }
})


// handle notification click (mark as read + redirect)
router.post('/:id/action', async (req, res) => {
    try {

        const userId = req.session.user.id;
        const notificationId = req.params.id;

        // fetch if notification exist
        const [notificationRows] = await pool.query(
            `SELECT * FROM notifications WHERE id = ? AND receiver_id = ?`, 
            [notificationId, userId]
        );

        const notification = notificationRows[0];

        if (!notificationRows.length) {
            return res.status(404).json({ error: 'Notification not found' });
        }


        // determine the redirect path based on type of notification
        let redirectPath = '/'; // default path to redirect the user if the type is not recoginized
        let state = {}; // object to carry data in react router or frontend
        const notif = notification;

        if (notif.type === 'message') {
            redirectPath = `/chat/${notif.sender_id}`;

        } else if (notif.type === 'group') {
              redirectPath= `/chat/${notif.sender_id}`;

        } else if (notif.type === 'New post') {
            redirectPath = `/posts/${notif.content}`; // here content is post_id
            
        }

        res.json({ 
            redirectTo: redirectPath,
            state
        });

    } catch (error) {
        console.error(error);
        res.status(500).json('Error processing notification');
    }
});

router.put('/:id/read', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
        res.sendStatus(200);

    } catch (err) {
      console.error('Failed to maekr as read', err);
      res.status(500).send('Server error');
    }
});

router.get('/unread-count', async (req, res) => {
 try {
    const userId = req.session.user.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS unread_count FROM notifications WHERE receiver_id = ? AND is_read = 0`,
        [userId]
    );

    res.json({ unread_count: rows[0].unread_count });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }

})
export default router