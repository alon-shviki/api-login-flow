require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// 1. LOGIN ROUTE (Plain Text)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`>>> Login attempt: Email=[${email}] Password=[${password}]`);
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Find user by email AND password directly
    const [users] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ? AND password_hash = ?', 
      [email, password]
    );

    if (users.length > 0) {
      const token = crypto.randomBytes(16).toString('hex');
      await connection.execute('UPDATE users SET token = ? WHERE id = ?', [token, users[0].id]);
      
      console.log("--- SUCCESS: User Found ---");
      res.json({ success: true, token: token });
    } else {
      console.log("--- FAILED: No match for this Email/Password combination ---");
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("!!! DB Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// 2. PROFILE ROUTE
app.get('/api/profile', async (req, res) => {
  const userToken = req.headers['authorization'];
  if (!userToken) return res.status(403).send("Error: No token");

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT email FROM users WHERE token = ?', [userToken]);
    
    if (users.length > 0) {
      res.send(`SUCCESS: Welcome ${users[0].email}. Verified via Header.`);
    } else {
      res.status(401).send("Error: Invalid Token");
    }
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) await connection.end();
  }
});

app.listen(3001, '0.0.0.0', () => {
    console.log('Backend running on port 3001 (Plain Text Mode)');
});