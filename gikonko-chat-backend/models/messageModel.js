import  db from './db.js';

// Save a new message
export async function saveMessage(sender_id, receiver_id, content, image = null) {
    const [result] = await db.query(
        `INSERT INTO messages (sender_id, receiver_id, content, image) 
         VALUES (?, ?, ?, ?)`,
        [sender_id, receiver_id, content, image]
    );
    return result.insertId;
}

// Get messages between two users
export async function getMessagesBetweenUsers(user1_id, user2_id) {
    const [messages] = await db.query(
        `SELECT m_id, sender_id, receiver_id, content, image, created_at 
         FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?) 
         OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at ASC`,
        [user1_id, user2_id, user2_id, user1_id]
    );
    return messages;
}

// Mark messages as read
export async function markMessagesAsRead(sender_id, receiver_id) {
    await db.query(
        `UPDATE messages SET read = 1 
         WHERE sender_id = ? AND receiver_id = ? AND read = 0`,
        [sender_id, receiver_id]
    );
}

// Get unread message count
export async function getUnreadCount(user_id) {
    const [result] = await db.query(
        `SELECT COUNT(*) as count FROM messages 
         WHERE receiver_id = ? AND read = 0`,
        [user_id]
    );
    return result[0].count;
}