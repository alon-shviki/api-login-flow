require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cors = require('cors');
const log4js = require('log4js');
const { Kafka } = require('kafkajs');

const app = express();
app.use(cors());
app.use(express.json());

// --- SRE: LOG4JS JSON CONFIGURATION ---
log4js.configure({
  appenders: {
    out: { type: 'stdout', layout: { type: 'messagePassThrough' } }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  }
});
const logger = log4js.getLogger('shviki-fitness');

// --- KAFKA SETUP ---
const kafka = new Kafka({ clientId: 'auth-api', brokers: ['kafka:9092'] });
const producer = kafka.producer();

const dbConfig = {
  host: process.env.DB_HOST || 'tidb-db',
  port: 4000,
  user: 'root',
  password: '',
  database: 'app_db'
};

const startServer = async () => {
  try {
    await producer.connect();
    console.log(">>> Kafka Producer Online");
    app.listen(3001, '0.0.0.0', () => {
      console.log('Backend API live on port 3001');
    });
  } catch (err) {
    console.error("Critical Setup Error:", err.message);
  }
};
startServer();

// --- ROUTE 1: LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let conn;

  try {
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT id, email FROM users WHERE email = ? AND password_hash = ?', 
      [email, password]
    );

    if (rows.length > 0) {
      const token = crypto.randomBytes(16).toString('hex');
      
      // Save token to DB
      await conn.execute('UPDATE users SET token = ? WHERE id = ?', [token, rows[0].id]);

      // SRE JSON Log
      const logData = {
        timestamp: new Date().toISOString(),
        userId: rows[0].id,
        action: 'LOGIN_SUCCESS',
        ipAddress: userIp
      };
      logger.info(JSON.stringify(logData));

      // Kafka Event
      await producer.send({
        topic: 'user-logins',
        messages: [{ value: JSON.stringify(logData) }]
      });

      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.end();
  }
});

// --- ROUTE 2: PROFILE (The missing route causing your error) ---
app.get('/api/profile', async (req, res) => {
  const userToken = req.headers['authorization'];
  
  if (!userToken) {
    return res.status(401).send("No token provided");
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [users] = await conn.execute(
      'SELECT email FROM users WHERE token = ?', 
      [userToken]
    );
    
    if (users.length > 0) {
      res.send(`SUCCESS: Welcome ${users[0].email}. Your token is valid in TiDB.`);
    } else {
      res.status(401).send("Invalid or expired token");
    }
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    if (conn) await conn.end();
  }
});