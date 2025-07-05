import pool from "../models/db.js";

export async function getAllUsers(req, res) {
     const currentUser = req.session.user?.name

     if (!currentUser) return res.status(404).json({ message: 'Not logged in' });
     
     const [rows] = await pool.query(
        `SELECT name, role, phone FROM user WHERE name != ?`,
        [currentUser]
     );

     res.json(rows);
}