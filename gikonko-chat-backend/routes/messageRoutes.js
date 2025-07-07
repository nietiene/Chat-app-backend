import express from "express";
import { saveMessage, getMessageBetweenUsers } from "../models/messageModel.js";
import { getUserIdByUsername } from "../models/userModel.js";

const router = express.Router();

router.get('/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    console.log(`Fetching messages between ${user1} and ${user2}`); // Debug log

    try {
        const user1Id = await getUserIdByUsername(user1);
        const user2Id = await getUserIdByUsername(user2);
        
        if (!user1Id || !user2Id) {
            console.log('User not found', { user1, user2 }); // Debug log
            return res.status(404).json({ error: 'One or both users not found' });
        }
        
        const messages = await getMessageBetweenUsers(user1Id, user2Id);
        console.log('Found messages:', messages); // Debug log
        
        // Ensure we're returning proper message objects
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            created_at: msg.created_at,
            image: msg.image || null
        }));
        
        res.json(formattedMessages);
        
    } catch(error) {
        console.error('Error fetching messages:', error); // Debug log
        res.status(500).json({ 
            error: 'Failed to get messages',
            details: error.message 
        });
    }
});

router.post('/', async (req, res) => {
    let { sender, receiver, content, image } = req.body;
    console.log('Saving message:', { sender, receiver, content }); // Debug log

    try {
        if (typeof sender === 'string') {
            sender = await getUserIdByUsername(sender);
        }

        if (typeof receiver === 'string') {
            receiver = await getUserIdByUsername(receiver);
        }
        
        const savedMessage = await saveMessage(sender, receiver, content, image || "");
        console.log('Message saved:', savedMessage); // Debug log
        
        res.status(201).json({ 
            message: 'Message saved',
            id: savedMessage.insertId 
        });
    } catch (error) {
        console.error('Error saving message:', error); // Debug log
        res.status(500).json({ 
            error: 'Failed to save message',
            details: error.message 
        });
    }
});

export default router;