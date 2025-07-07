import pool from "./db.js";
import bcrypt from "bcrypt";

export async function createUser(name, phone, password) {
    const hashed  = await bcrypt.hash(password, 10);
            
    if (!password && !typeof password !== 'string') {
         return res.status(400).json({ message: 'Password must be a string' });
        }
        
    console.log('password to hash:', password, typeof password);
    const [result] = await pool.query(
        `INSERT INTO user (name, phone, password) VALUES(?, ?, ?)`,
        [name, phone, hashed]
    );
    return result.insertId;
}

export async function findUserByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM user WHERE phone = ?', [phone]);
    return rows[0];
}

import { db } from './db.js';

// Get user by username
export async function getUserByUsername(username) {
    const [users] = await db.query(
        `SELECT user_id, name FROM users WHERE name = ?`,
        [username]
    );
    return users[0];
}

// Get user by ID
export async function getUserById(user_id) {
    const [users] = await db.query(
        `SELECT user_id, name FROM users WHERE user_id = ?`,
        [user_id]
    );
    return users[0];
}