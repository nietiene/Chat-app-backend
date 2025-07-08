import db from "../models/db.js";

export async function createGroup(req, res) {
      const { name, members } = req.body;
      const created_by = req.user.name;

      if (!name || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: 'Invalid group data' });
      }

      const conn = await db.getConnection();
      await conn.beginTransaction();

      try {
        const [groupResult] = await conn.query(
        'INSERT INTO groups (group_name, created_by, created_at) VALUES(?, ?, NOW())',
        [name, created_by]
        );

        const g_id = groupResult.insertId;

        for (const username of members) {
            const [[userRow]] = await conn.query(
                'SELECT user_id FROM user WHERE name = ?',
                [username]
            )
        }
      }
}