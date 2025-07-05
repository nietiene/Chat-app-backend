import express from "express";
import { register, login, logout, getProfile } from "../controllers/authController.js";
const router = express.Router();
import { getAllUsers  } from "../controllers/userController.js";

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.get('/', getAllUsers);


export default router;