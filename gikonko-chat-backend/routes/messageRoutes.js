import express from "express";
import { saveMessage, getMessageBetweenUsers } from "../models/messageModel.js";

const router = express.Router();

router.get('/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;

    try {
        const messages = await getMessageBetweenUsers(user1, user2);
        res.json(messages);
    } catch(error) {
        res.status(500).json({ error: 'Failed to get message' });
    }
});

router.post('/', async (req, res) => {
    const { sender, receiver, content, image } = req.body;

    try {
        await saveMessage(sender, receiver, content, image || null);
        res.status(201).json({ message: 'Message saved' });
    } catch (error) {
        
    }
})