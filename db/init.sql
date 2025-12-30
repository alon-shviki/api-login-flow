CREATE DATABASE IF NOT EXISTS app_db;

--Set the password for the user named in your .env
ALTER USER 'root'@'%' IDENTIFIED BY 'your_secure_password';
FLUSH PRIVILEGES;

USE app_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT IGNORE INTO users (username, email, password_hash) 
VALUES ('testuser', 'test@test.com', 'password123');