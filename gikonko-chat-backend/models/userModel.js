import pool from "./db.js";
import bcrypt from "bcrypt";

export async function createUser(name, phone, password) {
    const hashed  = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
        `INSERT INTO user (name, phone, role, password) VALUES(?, ?, ?)`,
        [name, phone, password]
    );
    return result.insertId;
}

export async function findUserByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM user WHERE phone = ?', [phone]);
    return rows[0];
}