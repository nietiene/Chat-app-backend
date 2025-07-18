import express from "express";
import pool from "../models/db.js";
import { sendNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get('/notification', sendNotification);

router.get('/notification', async (req, res) => {

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
router.post('/notification/mark-read/', async (req, res) => {

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

export default router