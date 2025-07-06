import express from "express";
import multer from "multer";
import db from "../models/db.js";
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
})

const uploads = multer({ storage });

router.post("/", uploads.single("image"), async (req, res) => {
        const { content } = req.body;
        const sender_id = req.session.user_id;
        const visible_to = "parent";
        const image = req.file ? req.file.filename : null;

        if (!sender_id || (!content && !image)) {
            return res.status(400).json({ error: "Content or image required" });
        }

        try {
           const query = "INSERT INTO posts (sender_id, content, image, created_at, visible_to) VALUES(?, ?, ?, NOW(), ?)";
           await db.query(
              query, [sender_id, content, image, visible_to], (err) => {
                 if (err) return res.status(500).json({ error: err.message });
                 res.json({ success: true, message: "Post created successfully" });
             }
         )
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
                  u,profile_image
                  FROM users u JOIN posts p
                  ON p.sender_id = u.user_id
                  WHERE p.visible_to = 'parent'
                  ORDER BY p.created_at ASC
                  `;
       db.query(query, (err, results) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(results);
    })   
    }
           
})

export default router;