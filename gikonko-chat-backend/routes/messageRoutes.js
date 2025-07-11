import express from 'express';
import { 
  saveMessage, 
  getMessagesBetweenUsers,
  markMessagesAsRead,
  getUserByName
} from '../models/messageModel.js';
import pool from '../models/db.js';

const router = express.Router();

// Get messages between two users
router.get('/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    console.log('GET messages between:', user1, user2);

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

// Send a message
router.post('/', async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;
    console.log('POST message:', { sender, receiver, content });

    // Check session user to prevent spoofing sender
    if (!req.session.user || !req.session.user.name) {
      return res.status(403).json({ error: 'Unauthorized: no logged in user' });
    }
    if (sender !== req.session.user.name) {
      return res.status(403).json({ error: 'Sender does not match logged in user' });
    }

    const senderData = await getUserByName(sender);
    const receiverData = await getUserByName(receiver);

    if (!senderData || !receiverData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const messageId = await saveMessage(senderData.user_id, receiverData.user_id, content);

    res.status(201).json({ success: true, messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Soft delete a message
router.delete('/:m_id', async (req, res) => {
  const { m_id } = req.params;

  try {
    if (!req.session.user || !req.session.user.name) {
      return res.status(403).json({ message: 'Unauthorized: No session user found' });
    }

    const currentUserData = await getUserByName(req.session.user.name);
    if (!currentUserData) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const [rows] = await pool.query('SELECT sender_id FROM messages WHERE m_id = ?', [m_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (rows[0].sender_id !== currentUserData.user_id) {
      return res.status(403).json({ message: 'You can only delete your own message' });
    }

    await pool.query('UPDATE messages SET is_deleted = TRUE WHERE m_id = ?', [m_id]);

    // emit event via socket.io
    req.app.get('io').emit('privateMessageDeleted', { m_id });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
