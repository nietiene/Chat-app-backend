import pool from "../models/db";

export async function getAllUsers(req, res) {
     const currentUser = req.session.user?.name

     if (!currentUser) return res.status(404).json({ message: 'Not logged in' });
     
     const [rows] = await pool.query(
        `SELECT name, role, phone FROM users WHERE name != ?`
     )
}