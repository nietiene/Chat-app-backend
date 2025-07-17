import db from "../models/db.js";

export const createNotification = async (req, res) => {
    const {	receiver_id, sender_id,	content, is_read = 0 } = req.body;
    const io = req.app.get('io');
    const created_at = new Date();

    try {
        const [result] = await db.query(
            'INSERT INTO notfications (receiver_id, sender_id, content, is_read, created_at) VALUES(?, ?, ?, ?, ?)',
            [receiver_id, sender_id, content, is_read, created_at]
        );

        const notification = {
            id: result.insertId,
            receiver_id,
            sender_id,
            content,
            is_read,
            created_at
        }
    }
    

}