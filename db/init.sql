Create Database IF NOT EXISTS app_db;
USE app_db;
Create Table IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
--test user
INSERT INTO users (email, password_hash) 
VALUES ('admin@example.com', 'hashed_password_123');