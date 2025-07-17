import db from './db.js';

export async function saveMessage(sender_id, receiver_id, content) {
    const [result] = await db.query(
        `INSERT INTO messages (sender_id, receiver_id, content, is_read) 
         VALUES (?, ?, ?, FALSE)`,
        [sender_id, receiver_id, content]
    );
    return result.insertId;
}

export async function getMessagesBetweenUsers(user1_id, user2_id) {
    // return only non deleted message
    const [rows] = await db.query(
        `SELECT m.*, u.name AS sender_name 
         FROM messages m
         JOIN user u ON m.sender_id = u.user_id
         WHERE 
           ((m.sender_id = ? AND m.receiver_id = ?) OR 
            (m.sender_id = ? AND m.receiver_id = ?))
           AND m.is_deleted = FALSE
         ORDER BY m.created_at ASC`,
        [user1_id, user2_id, user2_id, user1_id]
    );
    return rows;
}

export async function markMessagesAsRead(sender_id, receiver_id) {
    await db.query(
        `UPDATE messages SET is_read = 1 
         WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
        [sender_id, receiver_id]
    );
}
