import express from "express";
import pool from "../models/db.js";

const router = express.Router();

router.get('/notification/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE receiver_id = ? AND is_read = 0 ORDER BY created_at DESC',
            [user_id]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json('Error fetching notifications');
    }
})


// Mark as readed
router.post('/notification/mark-read/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        await pool.query (
            'UPDATE notifications SET is_read = 1 WHERE receiver_id = ?',
            [user_id]
        );
        res.sendStatus(200);

    } catch (error) {
       res.status(500).json('Error marking notification as read')
    }
})