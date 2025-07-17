import db from "../models/db.js";

export const createNotification = async (req, res) => {
    const {	receiver_id, sender_id,	content, is_read, created_at } = req.body;
    const io = req.app.get('io');
    

}