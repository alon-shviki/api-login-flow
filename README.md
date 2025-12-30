# 🧠 User Login and Profile Management System
This project provides a comprehensive user login and profile management system, utilizing a combination of Express.js, MySQL, Kafka, and Docker to create a scalable and efficient application. The system allows users to log in, retrieve their profiles, and produces Kafka events for login actions, which are consumed by a worker and logged to the console.

## 🚀 Features
* User login and authentication using Express.js and MySQL
* Profile retrieval and management
* Kafka event production for login actions
* Worker consumption and logging of Kafka events
* Dockerized application for easy deployment and management
* Initialization of the database using a SQL script

## 🛠️ Tech Stack
* Frontend: HTML, JavaScript
* Backend: Express.js, MySQL, Kafka
* Database: MySQL
* Messaging Queue: Kafka
* Containerization: Docker
Dependencies: `express`, `mysql2`, `kafkajs`, `log4js`, `cors`, `dotenv`
* DevDependencies: `docker-compose`

## 📦 Installation
To install the project, follow these steps:
1. Clone the repository using `git clone`
2. Run `./setup.sh` to initialize the database and start the application

## 💻 Usage
To use the application, follow these steps:
1. Open a web browser and navigate to `http://localhost:3001`
2. Log in using a valid username and password
3. Retrieve your profile information using the `/api/profile` endpoint
4. Verify that the Kafka events are being produced and consumed correctly

## 📂 Project Structure
```markdown
.
├── backend
│   ├── server.js
│   ├── worker.js
│   ├── package.json
│   └── ...
├── frontend
│   ├── index.html
│   └── ...
├── docker-compose.yml
├── init.sql
├── setup.sh
├── setup-db.sh
└── ...
```
