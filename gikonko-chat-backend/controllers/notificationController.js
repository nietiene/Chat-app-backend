import db from "../models/db.js";

export const createNotification = async (req, res) => {
    const {	receiver_id, sender_id,	content, is_read = 0 } = req.body;
    const io = req.app.get('io');

    try {
        const created_at = new Date();
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
        };

        io.to(`user_${receiver_id}`).emit('new_notification', notification);

        res.status(201).json({ success: true, notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
    

}