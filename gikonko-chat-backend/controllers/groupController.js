import db from "../models/db.js";

export async function createGroup(req, res) {
    const { group_name } = req.body;
    const userId = req.session.user_id;

    if (!group_name || !userId) {
        return res.status(400).json({ error: "Missing group name or user not logged in" })
    }

    try {
        const [result] = await
    }
}