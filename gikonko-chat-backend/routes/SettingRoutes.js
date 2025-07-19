import express from "express";
import pool from "../models/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.get('/me', async (req, res) => {
    const userId = req.sessio.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        
    }
})
