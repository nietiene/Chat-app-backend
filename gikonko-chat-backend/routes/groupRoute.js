import express from "express";
const router = express.Router();
import db from "../models/db.js";

router.post('/', async (req, res) => {
    try {
        const {group_name, members } = req.body;
        const created_by = req.user.name;
        const created_at = new Date();

        if (!group_name || !members || members.length === 0) {
            return res.status(400).json({ message: 'Group name and members required' })
        }

        await db.beginTransaction();

        const [groupResult] = await db.query(
            'INSERT INTO groups (group_name, created_by, created_at) VALUES(?, ?, ?)',
            [group_name, created_by, created_at]
        );

        const groupId = groupResult.insertId;

        const allMembers = [...new Set({...members, created_by})];

        for (const member of allMembers) {
            await db.query(
                'INSERT INTO group_members(g_id, user_id) VALUES(?, ?)',
                [groupId, member]
            );
        }
        await db.commit();

        res.status(201).json({
            g_id: groupId,
            group_name,
            created_by,
            created_at
        });
    } catch (error) {
        await db.rollback();
        console.error("Error in creating group", error);
        res.status(500).json({ message: 'Error in creating group:', error: error.message})
    }
});

router.get('/my', async (req, res) => {
    try {
        const [groups] = await db.query(
            `SELECT g.g_id, g.group_name, g.create_by, g.created_at
            FROM groups g 
            JOIN group_members gm ON g.g_id = gm.g_id
            WHERE gm.user_id = ?`,
            [req.user.name]
        );

        res.json(groups);
    } catch (error) {
        console.error("Error in fetching groups:", error);
        res.status(500).json({ message: 'Error fetching groups', error: error.message })
    }
});


router.post('/:groupId/messages', async (req, res) => {
    try {
        const { content } = req.body;
    }
})