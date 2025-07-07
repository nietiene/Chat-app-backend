import express from 'express';
import { 
    saveMessage, 
    getMessagesBetweenUsers,
    markMessagesAsRead,
    getUnreadCount
} from '../models/messageModel.js';
import { getUserByUsername, getUserById } from '../models/userModel.js';

const router = express.Router();

// Get messages between two users
router.get('/:user1/:user2', async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        
        // Get user IDs
        const user1Data = await getUserByUsername(user1);
        const user2Data = await getUserByUsername(user2);
        
        if (!user1Data || !user2Data) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Mark messages as read when fetching
        await markMessagesAsRead(user2Data.user_id, user1Data.user_id);
        
        // Get messages
        const messages = await getMessagesBetweenUsers(user1Data.user_id, user2Data.user_id);
        
        // Format response with usernames
        const formattedMessages = await Promise.all(messages.map(async msg => {
            const sender = await getUserById(msg.sender_id);
            const receiver = await getUserById(msg.receiver_id);
            return {
                ...msg,
                sender_username: sender.username,
                receiver_username: receiver.username
            };
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a new message
router.post('/', async (req, res) => {
    try {
        const { sender, receiver, content, image } = req.body;
        
        // Get user IDs
        const senderData = await getUserByUsername(sender);
        const receiverData = await getUserByUsername(receiver);
        
        if (!senderData || !receiverData) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Save message
        const messageId = await saveMessage(
            senderData.user_id,
            receiverData.user_id,
            content,
            image || null
        );

        res.status(201).json({ 
            message: 'Message sent successfully',
            messageId 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get unread message count
router.get('/unread/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await getUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const count = await getUnreadCount(user.user_id);
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

export default router;