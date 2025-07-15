import pool from "../models/db.js";

export async function getAllUsers(req, res) {
     const currentUser = req.session.user?.name

     if (!currentUser) return res.status(404).json({ message: 'Not logged in' });
     
     const [rows] = await pool.query(
        `SELECT name, role, phone, profile_image FROM user WHERE name != ?`,
        [currentUser]
     );

     res.json(rows);
}

export const getCurrentUser = (req, res) => {
   if (req.session.user) {
      const { id, name } = req.session.user;
      res.json({ id, name });
   } else {
      res.status(401).json({ eror: 'Not logged in'});
   }
}

export const getGroupInfo = async (req, res) => {
   const { g_id } = req.params;
   const [[group]] = await pool.query("SELECT * FROM groups WHERE g_id = ?", [g_id]);
   res.json(group); 
}