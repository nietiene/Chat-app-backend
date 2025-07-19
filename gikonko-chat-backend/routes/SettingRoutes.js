import express from "express";
import pool from "../models/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.get('/me', async (req, res) => {
    const userId = req.session.user.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const [rows] = await pool.query('SELECT name, phone, FROM user WHERE user_id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})
