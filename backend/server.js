require('dotenv').config({ path: '../.env' });
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.urlencoded({ extended: true }));

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND password_hash = ?', 
      [email, password]
    );
    await connection.end();

    if (rows.length > 0) {
      res.send(`SUCCESS: LOGGED IN. Welcome ${email}`);
    } else {
      res.status(401).send("FAILED: UNAUTHORIZED");
    }
  } catch (err) {
    res.status(500).send("DATABASE ERROR: " + err.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server on http://localhost:${PORT}`);
});