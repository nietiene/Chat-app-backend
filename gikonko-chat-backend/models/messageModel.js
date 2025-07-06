import pool from "./db.js";

export async function saveMessage(sender, receiver, content, image = "") {
    const [result] = await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, content, image) VALUES(?, ?, ?, ?)",
        [sender, receiver, content, image]
    );
    return result;
    
}


export async function getMessageBetweenUsers(user1, user2) {

}