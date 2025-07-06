import express from "express";
import multer from "multer";
import db from "..models/db.js";
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
})

const uploads = multer({ storage });

router.post("/", uploads.single("image"), (req, res) => {
        const { content } = req.body;
        const sender_id = req.session.user_id;
        const visible_to = "parent";
        const image = req.file ? req.file.filename : null;

        if (!sender_id || (!content && !image)) {
            return res.status(400).json({ error: "Content or image required" });
        }

        const query = "INSERT INTO posts (sender_id, content, image, created_at, visible_to) VALUES(?, ?, ?, ?, ?)";
})