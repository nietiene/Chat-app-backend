import db from './db.js';

export async function getUserByName(name) {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name FROM user WHERE name = ?',
      [name]
    );
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error('DB error in getUserByName:', err);
    throw err;
  }
}

export async function saveMessage(sender_id, receiver_id, content) {
  try {
    const [result] = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
      [sender_id, receiver_id, content]
    );
    console.log('Inserted message ID:', result.insertId);
    return result.insertId;
  } catch (err) {
    console.error('DB insert error in saveMessage:', err);
    throw err;
  }
}

export async function getMessagesBetweenUsers(user1_id, user2_id) {
  try {
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
  } catch (err) {
    console.error('DB error in getMessagesBetweenUsers:', err);
    throw err;
  }
}

export async function markMessagesAsRead(sender_id, receiver_id) {
  try {
    await db.query(
      `UPDATE messages SET read = 1 
       WHERE sender_id = ? AND receiver_id = ? AND read = 0`,
      [sender_id, receiver_id]
    );
  } catch (err) {
    console.error('DB error in markMessagesAsRead:', err);
    throw err;
  }
}
