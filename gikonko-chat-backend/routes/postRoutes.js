import express from "express";
import multer from "multer";
import db from "../models/db.js";
import { sendNotification } from "../controllers/notificationController.js";
import pool from "../models/db.js";
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
        cb(null, safeName);
    }
})

const uploads = multer({ storage });

router.post("/", uploads.single("image"), async (req, res) => {

        const { content } = req.body;
        const sender_id = req.session.user?.id;
        const visible_to = "parent";
        const image = req.file ? req.file.filename : null;

        if (!sender_id || (!content && !image)) {
            return res.status(400).json({ error: "Content or image required" });
        }

        try {
           const query = "INSERT INTO posts (sender_id, content, image, created_at, visible_to) VALUES(?, ?, ?, NOW(), ?)";
           await db.query(query, [sender_id, content, image, visible_to]);
           res.json({ success: true, message: "Post created successfully" });

           // fetch all parents to notify them
           const [parents] = await db.query("SELECT user_id FROM user WHERE role = 'parent'");

           for (let parent of parents) {
            await sendNotification({
                receiver_id: parent.user_id,
                sender_id,
                type: 'New post',
                content: postId.toString()
            })
           }

           res.json({ success: true, message: 'Post created and notification sent' });
        } catch (error) {
               console.error(error);
               res.status(500).json({ error: "Database error" }); 
       }

})

router.get("/", async (req, res) => {
    try {
       const query = `
                  SELECT p.* ,
                  u.name,
                  u.role,
                  u.profile_image
                  FROM \`user\` u JOIN posts p
                  ON p.sender_id = u.user_id
                  WHERE p.visible_to = 'parent'
                  ORDER BY p.created_at ASC
                  `;

    const [results] = await db.query(query);
    res.json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch posts "});
    }
           
})

router.get('/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const [rows] = await pool.query(
            `SELECT p.*, u.name AS author_name FROM posts p
            LEFT JOIN user u ON p.user_id = u.user_id
            WHERE p.post_id = ?`,
            [postId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });

        }

        return res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching post' });
    }
})

export default router;