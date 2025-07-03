import pool from "./db";
import bcrypt from "bcrypt";

export async function createUser(name, phone, password) {
    const hashed  = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
        `INSERT INTO user (name, phone, role, password) VALUES(?, ?, ?)`,
        [name, phone, password]
    );
    return result.insertId
}