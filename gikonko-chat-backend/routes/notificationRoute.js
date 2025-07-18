import express from "express";
import pool from "../models/db.js";
import { sendNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get('/notification', sendNotification);

router.get('/', async (req, res) => {

    try {

        const userId = req.session.user.id;

        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE receiver_id = ? AND is_read = 0 ORDER BY created_at DESC',
            [userId]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json('Error fetching notifications');
    }
})


// Mark as readed
router.post('/notification/mark-read', async (req, res) => {

    try {
        const userId = req.session.user.id;

        await pool.query (
            'UPDATE notifications SET is_read = 1 WHERE receiver_id = ?',
            [userId]
        );
        res.sendStatus(200);

    } catch (error) {
       res.status(500).json('Error marking notification as read')
    }
})


// handle notification click (mark as read + redirect)
router.post('/:id/action', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const notificationId = req.params.id;

        const [notification] = await pool.query(
            `SELECT * FROM notifications WHERE id = ? AND receiver_id = ?`, 
            [notificationId, userId]
        );

        if (!notification.length) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await pool.query(
            `UPDATE notifications SET is_read = 1 WHERE id = ?`,
            [notificationId]
        );

        // determine the redirect path based on type of notification
        let redirectPath = '/';
        const notif = notification[0];

        if (notif.type === 'message') {
            redirectPath = `/chat/${notif.sender_id}`;

        } else if (notif.type === 'group') {
              redirectPath= `/chat/${notif.sender_id}`
        } else if (notif.type === 'New post') {
            redirectPath = `/dashboard/${notif.sender_id}`
        }

        res.json({ redirectTo: redirectPath });

    } catch (error) {
        console.error(error);
        res.status(500).json('Error processing notification');
    }
})
export default router