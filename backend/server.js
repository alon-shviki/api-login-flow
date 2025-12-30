require('dotenv').config({ path: '../.env' });
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Simple Health Check API
app.get('/api/health', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    await connection.end();
    
    res.json({ 
      status: "Success", 
      message: "Connected to TiDB using .env configuration",
      data: rows[0].result 
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend is running on port ${PORT}`));