require('dotenv').config();
const mysql = require('mysql2');

// Create MySQL connection with environment variables and fallback defaults
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root147369',
    database: process.env.DB_NAME || 'career_hub_db'
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('MySQL Database Connected Successfully to: ' + (process.env.DB_NAME || 'career_hub_db'));
});

module.exports = connection;
