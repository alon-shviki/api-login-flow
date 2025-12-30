require('dotenv').config({ path: '../.env' });
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

//Generates token and saves it in TiDB
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND password_hash = ?', 
      [email, password]
    );

    if (users.length > 0) {
      const token = crypto.randomBytes(16).toString('hex');
      await connection.execute('UPDATE users SET token = ? WHERE id = ?', [token, users[0].id]);
      res.json({ success: true, token: token });
    } else {
      res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

//Checks for the token in the HTTP Authorization Header
app.get('/api/profile', async (req, res) => {
  const userToken = req.headers['authorization'];
  
  if (!userToken) return res.status(403).send("Error: No token in Header");

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT email FROM users WHERE token = ?', [userToken]);

    if (users.length > 0) {
      res.send(`SUCCESS: Welcome ${users[0].email}. Your token was verified via Header.`);
    } else {
      res.status(401).send("Error: Invalid Token");
    }
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) await connection.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});