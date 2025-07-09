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

        const [[creatorRow]] = await conn.query(
            'SELECT user_id FROM user WHERE name = ?',
            [created_by]
        )
        if (!creatorRow) throw new Error(`Creator not found ${created_by}`)

            const creator_id = creatorRow.user_id;

            await conn.query(
                'INSERT INTO group_members (g_id, user_id, joined_at) VALUES(?, ?, NOW())',
                [g_id, creator_id]
            )
        for (const username of members) {
            const [[userRow]] = await conn.query(
                'SELECT user_id FROM user WHERE name = ?',
                [username]
            );

            if (!userRow) throw new Error(`User not found: ${username}`);

            if (userRow.user_id !== creator_id) { // avoid duplicated insert
               await conn.query(
                   'INSERT INTO group_members (g_id, user_id, joined_at) VALUES(?, ?, NOW())',
                   [g_id, userRow.user_id]
            )
        }
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
      const user_id  = req.session.user.id;
      console.log('Session user:', req.session.user);

      try {
        const [groups] = await db.query(
            `SELECT g.g_id, g.group_name, g.created_by, g.created_at
             FROM groups g
             JOIN group_members gm ON g.g_id = gm.g_id
             WHERE gm.user_id = ?
             ORDER BY g.created_at DESC`,
            [user_id]
        );
 
        console.log('Group fetched:', groups);
        res.json(groups);
      } catch (err) {
        console.error('Error fetching user groups', err);
        res.status(500).json({ message: 'Failed to fetch groups' })
      }
}
export async function getGroupMessages(req, res) {
    const { g_id } = req.params;
    const user_id = req.user?.id || req.session.user?.id; // Handle both auth methods

    if (!user_id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Verify group membership
        const [membership] = await db.query(
            'SELECT 1 FROM group_members WHERE g_id = ? AND user_id = ?',
            [g_id, user_id]
        );
        
        if (!membership.length) {
            return res.status(403).json({ message: 'Not a group member' });
        }

        // Fetch messages
        const [messages] = await db.query(
            `SELECT 
                gm.id, 
                gm.user_id, 
                u.name AS sender_name,
                gm.type, 
                gm.content, 
                gm.created_at
             FROM group_messages gm
             JOIN user u ON gm.user_id = u.user_id
             WHERE gm.g_id = ?
             ORDER BY gm.created_at ASC`,
            [g_id]
        );
        
        res.json(messages);
    } catch (err) {
        console.error('Error fetching group messages:', err);
        res.status(500).json({ message: 'Failed to fetch group messages' });
    }
}

export async function sendGroupMessage(req, res) {
    const { g_id } = req.params;
    const { content, type = 'text' } = req.body;
    const user_id = req.user?.id || req.session.user?.id;

    if (!user_id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Verify membership
        const [[isMember]] = await conn.query(
            'SELECT 1 FROM group_members WHERE g_id = ? AND user_id = ?',
            [g_id, user_id]
        );
        
        if (!isMember) {
            await conn.rollback();
            return res.status(403).json({ message: 'Not a group member' });
        }

        // Insert message
        const [result] = await conn.query(
            'INSERT INTO group_messages (g_id, user_id, type, content, created_at) VALUES(?, ?, ?, ?, NOW())',
            [g_id, user_id, type, content]
        );

        await conn.commit();
        
        // Return the created message
        const [[message]] = await db.query(
            `SELECT 
                gm.id, 
                gm.user_id, 
                u.name AS sender_name,
                gm.type, 
                gm.content, 
                gm.created_at
             FROM group_messages gm
             JOIN user u ON gm.user_id = u.user_id
             WHERE gm.id = ?`,
            [result.insertId]
        );

        res.status(201).json(message);
    } catch (err) {
        await conn.rollback();
        console.error('Error sending group message', err);
        res.status(500).json({ message: 'Failed to send message' });
    } finally {
        conn.release();
    }
}