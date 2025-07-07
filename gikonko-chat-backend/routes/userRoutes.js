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
        const 
    }
})

router.get('/', getAllUsers);

export default router;