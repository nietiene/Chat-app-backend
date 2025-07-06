import { getAllUsers  } from "../controllers/userController.js";
import express from "express";

const router = express.Router();


router.get('/', getAllUsers);

export default router;