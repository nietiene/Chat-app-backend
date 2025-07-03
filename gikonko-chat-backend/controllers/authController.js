import { createUser, findUserByPhone } from "../models/userModel.js";
import bcrypt from "bcrypt";

export async function register (req, res) {
     try {
        const { name, phone, password } = req.body;
        const existingUser = await findUserByPhone(phone);

            if (existingUser) {
                return res.status(400).json({ message: 'User already exist' });
            }

            await createUser(name, phone, password);
            res.json({ message: 'Registration successfully' });
     } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
     }
}

