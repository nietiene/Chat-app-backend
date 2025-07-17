import express from "express";
import pool from "../models/db";

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
    const { user_id } = 
})