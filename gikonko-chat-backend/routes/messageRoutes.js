import express from 'express';
import { 
    saveMessage, 
    getMessagesBetweenUsers,
    
} from '../models/messageModel.js';
import { getUserByName } from '../models/userModel.js';
import pool from '../models/db.js';

const router = express.Router();

router.get('/:user1/:user2', async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        
        const user1Data = await getUserByName(user1);
        const user2Data = await getUserByName(user2);
        
        if (!user1Data || !user2Data) {
            return res.status(404).json({ error: 'User not found' });
        }

        const messages = await getMessagesBetweenUsers(user1Data.user_id, user2Data.user_id);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { sender, receiver, content } = req.body;
        
        const senderData = await getUserByName(sender);
        const receiverData = await getUserByName(receiver);
        
        if (!senderData || !receiverData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const messageId = await saveMessage(
            senderData.user_id,
            receiverData.user_id,
            content
        );

       const [[fullMessage]] = await pool.query(
        `SELECT m.*, u.name AS sender_name
        FROM messages m
        JOIN user u ON m.sender_id = u.user_id
        WHERE m.m_id = ?`,
        [messageId]
       );
       
       res.status(201).json(fullMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

router.delete('/:m_id', async (req, res) => {
    const { m_id }  = req.params;

    try {
        const currentUser = req.session.user;
        if (!currentUser || !currentUser.name) {
             return res.status(403).json({ message: 'Unauthorized: No session user found' });
        }
        
        const currentUserData = await getUserByName(currentUser.name);

        if (!currentUserData) {
            return res.status(403).json({ message: 'Unauthorized'})
        }

        const [rows] = await pool.query('SELECT sender_id FROM messages WHERE m_id = ?', [m_id]);

        if (rows.length === 0) {
            return res.status(494).json({ message: 'Message not deleted' })
        }
        if (rows[0].sender_id !== currentUserData.user_id) {
            return res.status(403).json({ message: 'You can only delete your own message' });
        }

        await pool.query('UPDATE messages SET is_deleted = TRUE where m_id = ?', [m_id]);

        //emit delete event
        req.app.get('io').emit('privateMessageDeleted', { m_id });
        
        res.json({ message: 'Private message soft-deleted' });
    } catch (error) {
        console.error('Error in deleting message', error);
        res.status(500).json({ message: 'Intenal server erro' });
    }

})


// handle unread backend count

router.get('/unread/:receiver', async (req, res) => {
    try {
        const { receiver } = req.params;

        const receiverData = await getUserByName(receiver);
        if (!receiverData) {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        const [rows] = await pool.query(
            `SELECT sender_id, COUNT(*) AS unread_count
            FROM messages
            WHERE receiver_id = ? AND is_read = FALSE and is_deleted = FALSE
            GROUP BY sender_id`,
            [receiverData.user_id]
        )

        res.json(rows);
    } catch (error) {
        console.error('Error fetching unread message', error);
        res.status(500).json({ error: 'Failed to fetch unread messages' });

    }
});

router.patch('/mark-read', async (req, res) => {
    try {
        const { sender, receiver } = req.body;

        const senderData = await getUserByName(sender);
        const receiverData = await getUserByName(receiver);

        if (!senderData || !receiverData) {
            return res.status(404).json({ error: 'User not found' });
        }

        await pool.query(
            `UPDATE messages SET is_read = TRUE
            WHERE sender_id = ? AND receiver_id = ? AND is_Read = FALSE`,
            [senderData.user_id, receiverData.user_id]
        );

        res.json({ message: 'Message marked as read' });

    } catch (error) {
        console.error('Errror marking messages as read', error);
        res.status(500).json({ error: 'Failed to update messages' });
    }
})
export default router