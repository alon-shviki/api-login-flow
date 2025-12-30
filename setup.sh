#!/bin/bash

# Clean old state (removes containers, networks, volumes for a fresh start)
docker compose down -v

# Build and start all services fresh (including TiDB, Kafka, CDC, backend, frontend, workers)
docker compose up -d --build

# Wait for TiDB to be ready...
while ! mysql -h 127.0.0.1 -P 4000 -u root -e "SELECT 1" &> /dev/null; do
    sleep 2
done

# Feed PLAIN TEXT init.sql...
cat init.sql | mysql -h 127.0.0.1 -P 4000 -u root

# Verify Database Content...
# This will show exactly what is inside the password column
mysql -h 127.0.0.1 -P 4000 -u root -e "USE app_db; SELECT email, password_hash FROM users;"

# Restart API to apply any changes...
docker restart login-api

echo "DONE. System is fully set up from zero!"
echo "Frontend: http://localhost:8080"
echo "Watch CDC logs: docker logs -f cdc-worker"
echo "Watch login events: docker logs -f login-worker"