import { getAllUsers  } from "../controllers/userController.js";
import express from "express";
import multer from "multer";
import path from "path";
import db from "../models/db.js"

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = req.session.user.id + "-" + Date.now() + ext;
        cb(null, filename);
    },
})

const upload = multer({ storage });


 function isLoggedIn(req, res, next) {
    if (!req.session.user || !req.session.user.id) return res.status(401).json({ error: "Unauthorized" });
    next();
 }

 router.post("/change-profile-photo", isLoggedIn, upload.single("profile_image"), async (req, res) => {
try {
  
    const [users] = await db.query('SELECT * FROM user WHERE user_id != ?', [req.session.user.id]);

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const sql = "UPDATE user SET profile_image = ? WHERE user_id = ?";

    db.query(sql, [req.file.filename, req.session.user.id]);
      
    req.session.user.profile_image = req.file.filename;

    const notificationSql = `
       INSERT INTO notifications (receiver_id, sender_id, type, content, is_read, created_at)
       VALUES(?, ?, ?, ?, ?, NOW())`;
    
    const notificationPromise = users.map(user => {
        const notificationContent = `${req.session.user.name} Updated their profile picture`;
        return db.query(notificationSql, [
            user.user_id, // reciever_id (each user)
            req.session.user.id, // sender_id
            'profile_update', // type
            notificationContent, // content
            0
        ]);
    })

    await Promise.all(notificationPromise); // insert all notification ad once
    req.session.user.profile_image = req.file.filename;
    res.json({
        success: true,
        filename: req.file.filename,
        profile_image: req.file.filename
    });
      
} catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
}
 })

router.get('/', getAllUsers);

// Add this to your userRoutes.js
router.get('/', async (req, res) => {
    try {
        const query = "SELECT user_id, name FROM user";
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(results);
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
export default router;