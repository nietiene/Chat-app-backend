import { getAllUsers  } from "../controllers/userController.js";
import { getAllUsersExcept } from "../models/userModel.js";
import express from "express";

const router = express.Router();


router.get('/', getAllUsers);

router.get('/all', async (req, res) => {
    try {
        const users = await getAllUsersExcept(req.session.user.name);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

export default router;