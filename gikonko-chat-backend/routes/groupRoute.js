import express from "express";
const router = express.Router();
import db from "../models/db.js";

router.post('/', async (req, res) => {
    try {
        const {group_name, members } = req.body;
        const created_by = req.user.name;
        const created_at = new Date();

        if (!group_name || !members || members.length === 0) {
            
        }
    }
})