require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cors = require('cors');
const { Kafka } = require('kafkajs'); // Added KafkaJS

const app = express();
app.use(cors());
app.use(express.json());

// 1. KAFKA CONFIGURATION
const kafka = new Kafka({
  clientId: 'shviki-fitness-api',
  brokers: ['kafka:9092'] // Corresponds to the service name in docker-compose
});
const producer = kafka.producer();

// 2. DB CONFIGURATION
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Start Kafka Producer
const initKafka = async () => {
  try {
    await producer.connect();
    console.log(">>> Kafka Producer Connected Successfully");
  } catch (err) {
    console.error("!!! Kafka Connection Error:", err.message);
  }
};
initKafka();

// 3. LOGIN ROUTE (The Event Producer)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ? AND password_hash = ?', 
      [email, password]
    );

    if (users.length > 0) {
      const token = crypto.randomBytes(16).toString('hex');
      await connection.execute('UPDATE users SET token = ? WHERE id = ?', [token, users[0].id]);

      // --- KAFKA EVENT PRODUCTION ---
      const loginEvent = {
        userId: users[0].id,
        email: users[0].email,
        timestamp: new Date().toISOString(),
        action: 'USER_LOGIN'
      };

      await producer.send({
        topic: 'user-logins',
        messages: [{ value: JSON.stringify(loginEvent) }],
      });
      // ------------------------------

      console.log(`[API] Event sent to Kafka for: ${email}`);
      res.json({ success: true, token: token });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// 4. PROFILE ROUTE
app.get('/api/profile', async (req, res) => {
  const userToken = req.headers['authorization'];
  if (!userToken) return res.status(403).send("No token");

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT email FROM users WHERE token = ?', [userToken]);
    if (users.length > 0) {
      res.send(`SUCCESS: Welcome ${users[0].email}. Verified via Kafka-integrated API.`);
    } else {
      res.status(401).send("Invalid Token");
    }
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (connection) await connection.end();
  }
});

app.listen(3001, '0.0.0.0', () => console.log('API Running on 3001 (Kafka Producer Active)'));