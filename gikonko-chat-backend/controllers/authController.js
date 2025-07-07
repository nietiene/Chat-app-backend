import { createUser, findUserByPhone } from "../models/userModel.js";
import bcrypt from "bcrypt";

export async function register (req, res) {
     try {
        const { name, phone, password } = req.body;

        const existingUser = await findUserByPhone(phone);

            if (existingUser) {
                return res.status(400).json({ message: 'User already exist' });
            }
  
            if (typeof password !== 'string') {
                return res.status(400).json({ message: 'password must be a string' });
            }
            await createUser(name, phone, password);
            res.json({ message: 'Registration successfully' });
     } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
     }
}

export async function login(req, res) {
    try {
        const { phone, password } = req.body;
        const user = await findUserByPhone(phone);

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
             return res.status(400).json({ message: 'Invalid credentials' });
        }

        req.session.user = {
            id: user.user_id,
            name: user.name,
            phone: user.phone,
            role: user.role
        }

        res.json({ message: "Login successfully", user: req.session.user });    
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Server error' });
    }
} 


export function logout (req, res) {
    req.session.destroy(() => {
        res.json({ message: 'Logged out' });
    });
}

export function getProfile(req, res) {
   if (req.session.user) {
    res.json(req.session.user);
   } else {
    res.status(401).json({ message: 'Unauthorized' });
   }
}