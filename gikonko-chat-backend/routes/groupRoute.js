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
    }
})