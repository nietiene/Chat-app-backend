import db from "../models/db.js";


let io = null;
let onlineUsers = {};

export function setupNotificationService (socketIO, users) {
    io = socketIO,
    onlineUsers = users;
}
export const sendNotification = async ({ receiver_id, sender_id, type, content }) => {
    try {

        const created_at = new Date();
        const [result] = await db.query(
            'INSERT INTO notifications (receiver_id, sender_id, type, content) VALUES(?, ?, ?, ?)',
            [receiver_id, sender_id, type, content]
        );


        const socketId = onlineUsers[receiver_id];

        if (socketId && io) {
            io.to(socketId).emit('notification', {
               id: result.insertId,
               receiver_id,
               sender_id,
               content,
               is_read: 0,
               created_at
            })
        }

    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
    

}