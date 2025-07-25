import express from "express";
import pool from "../models/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.get('/me', async (req, res) => {
    const userId = req.session.user.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const [rows] = await pool.query('SELECT name, phone FROM user WHERE user_id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


//update setting 

router.post('/update', async (req, res) => {
    const userId = req.session.user.id;
    const { name, phone, oldPassword, newPassword}  = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const [userRows] = await pool.query('SELECT password FROM user WHERE user_id = ?', [userId]);
        if (userRows.length === 0) return res.send(404).json({ message: 'User not found' });


        let query = 'UPDATE user SET ';
        const values = [];

        // if name is exist add it to the sql query and their value
        if (name) {
            query += ' name = ?,';
            values.push(name);
        }

        // also here
        if (phone) {
            query += ' phone = ?,';
            values.push(phone);
        }

        if (!oldPassword) {
            return res.status(400).json({ message: 'Old password is required to update settings' });
        }
           
        const isMatch = await bcrypt.compare(oldPassword, userRows[0].password);
        if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            query += ' password = ?,';
            values.push(hashedPassword);
        }

        if (values.length === 0) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        // slice() it takes string from index 0 but not including last character
        query = query.slice(0, -1); // remove last comma 
        query += ' WHERE user_id = ?';
        values.push(userId);
        
        await pool.query(query, values);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Update failed' });
    }
})


export default router;