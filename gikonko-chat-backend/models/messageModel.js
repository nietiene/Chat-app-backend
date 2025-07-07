import db from './db.js';

export async function saveMessage(sender_id, receiver_id, content) {
    const [result] = await db.query(
        `INSERT INTO messages (sender_id, receiver_id, content) 
         VALUES (?, ?, ?)`,
        [sender_id, receiver_id, content]
    );
    return result.insertId;
}

export async function getMessagesBetweenUsers(user1_id, user2_id) {
    const [messages] = await db.query(
        `SELECT m.*, u1.name as sender_name, u2.name as receiver_name
         FROM messages m
         JOIN user u1 ON m.sender_id = u1.user_id
         JOIN user u2 ON m.receiver_id = u2.user_id
         WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
         ORDER BY m.created_at ASC`,
        [user1_id, user2_id, user2_id, user1_id]
    );
    return messages;
}

export async function markMessagesAsRead(sender_id, receiver_id) {
    await db.query(
        `UPDATE messages SET read = 1 
         WHERE sender_id = ? AND receiver_id = ? AND read = 0`,
        [sender_id, receiver_id]
    );
}