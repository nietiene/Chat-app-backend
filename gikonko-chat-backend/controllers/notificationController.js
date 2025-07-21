import db from "../models/db.js";


let io = null; // holds your socket.IO server instance; we it to null because it is not yet set
let onlineUsers = {}; // this objects helps to map user_Id and their socket_id


// this function initialize notification servises by setting up io and online users
export function setupNotificationService (socketIO, users) {
    io = socketIO, // main socket.IO server you pass in
    onlineUsers = users; // mapping connected users
}
export const sendNotification = async ({ receiver_id, sender_id, type, content }) => {
    try {

        const created_at = new Date();
        const [result] = await db.query(
            'INSERT INTO notifications (receiver_id, sender_id, type, content) VALUES(?, ?, ?, ?)',
            [receiver_id, sender_id, type, content]
        );


        const socketId = onlineUsers[receiver_id]; // gets socket IDs of who should receive notification

        if (socketId && io) { // if we get those socket ID and socket.IO server is set  run those following code

            // this sends real time notification event for only olnine user
            // to() is used to target spacific socket or group of sockets
            // emit() is used to send an event
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