import express from "express";
import { saveMessage, getMessageBetweenUsers } from "../models/messageModel.js";
import { getUserIdByUsername } from "../models/userModel.js";

const router = express.Router();

router.get('/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;

    try {
        const user1Id = await getUserIdByUsername(user1);
        const user2Id = await getUserIdByUsername(user2);
        
        const messages = await getMessageBetweenUsers(user1Id, user2Id);
        res.json(messages);
    } catch(error) {
        res.status(500).json({ error: 'Failed to get message' });
    }
});

router.post('/', async (req, res) => {
    let { sender, receiver, content, image } = req.body;

    try {
        if (typeof sender === 'string') {
            sender = await getUserIdByUsername(sender);
        }

        if (typeof receiver === 'string') {
            receiver = await getMessageBetweenUsers(receiver);
        }
        await saveMessage(sender, receiver, content, image || "");
        res.status(201).json({ message: 'Message saved' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save message '});
    }
})

export default router;