import pool from "./db.js";
import bcrypt from "bcrypt";

export async function createUser(name, phone, password) {
    // Validate password type early, but do NOT return res in model (no access to res here)
    if (typeof password !== 'string' || !password) {
        throw new Error('Password must be a non-empty string');
    }

    const hashed = await bcrypt.hash(password, 10);

    console.log('password to hash:', password, typeof password);

    const [result] = await pool.query(
        `INSERT INTO user (name, phone, password) VALUES (?, ?, ?)`,
        [name, phone, hashed]
    );

    return result.insertId;
}

export async function findUserByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM user WHERE phone = ?', [phone]);
    return rows[0];
}
