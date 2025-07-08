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
            );

            if (!userRow) throw new Error(`User not found: ${username}`);

            await conn.query(
                'INSERT INTO group_members (g_id, user_id, joined_at) VALUES(?, ?, NOW())',
                [g_id, userRow.user_id]
            )
        }
        await conn.commit();
        res.status(201).json({ message: 'Group created successfully', g_id })
      } catch (error) {
        await conn.rollback();
        console.error("Error creating group", error);
        res.status(500).json({ members: 'Failed to create group' });
      } finally {
        conn.release();
      }
}

export async function getMyGroup(req, res) {
      const user_id  = req.user.user_id;

      
}