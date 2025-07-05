import db from "./db.js";

export function saveMessage(sender, receiver, content, image = null) {
    return new Promise((resolve, reject) => {
        const query = "INSERT INTO messages (sender_id, receiver_id, content, image) VALUES(?, ?, ?, ?)";
        db.query(query, [sender, receiver, content, image], (err, result) => {
            if (err) return reject(err);

            resolve(resolve);
        })
    })
}