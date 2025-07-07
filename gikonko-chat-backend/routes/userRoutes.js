import { error } from "console";
import { getAllUsers  } from "../controllers/userController.js";
import express from "express";
import multer from "multer";
import path from "path";

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

 router.post("/chang-profile-photo", isLoggedIn, upload.single("profile_image"), ())

router.get('/', getAllUsers);

export default router;