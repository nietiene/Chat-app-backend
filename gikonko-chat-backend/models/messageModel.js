import pool from "./db.js";

export async function saveMessage(sender, receiver, content, image = "") {
    const [result] = await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, content, image)"
    )
    
}


export function getMessageBetweenUsers(user1, user2) {
    return new Promise((resolve, reject) => {
        const query = `
                     SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                     ORDER BY created_at ASC
                     `;
      pool.query(query, [user1, user2, user2, user1], (err, result) => {
        if (err) reject(err);

        resolve(result);
      });

    })
}