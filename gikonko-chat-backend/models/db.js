import mysql from "mysql2/promise"; // here promise let you use async / await wiht mysql queries
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, // when connection is full means it exceed to 20 connection is to wait until connection become available istead of fail
    connectionLimit: 10, // maximum number of connection
    queueLimit: 0 // 

});

export default pool;