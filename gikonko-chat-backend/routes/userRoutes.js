import { getAllUsers  } from "../controllers/userController.js";
import express from "express";
import multer from "multer";
import path from "path";
import db from "../models/db.js"
import { error } from "console";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "/uploads/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = req.session.user_id + "-" + Date.now() + ext;
        cb(null, filename);
    },
})

const upload = multer;
 ({ storage });

 function isLoggedIn(req, res, next) {
    if (!req.session.user_id) return res.status(401).json({ error: "Unauthorized" });
    next();
 }

 router.post("/chang-profile-photo", isLoggedIn, upload.single("profile_image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const sql = "UPDATE user SET profile_image = ? WHERE user_id = ?";
    db.query(sql, [req.file.filename, req.session.user_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Profile image updated" });
    })
 })

router.get('/', getAllUsers);

export default router;