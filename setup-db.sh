#!/bin/bash

echo "Wait for TiDB to be ready..."
while ! mysql -h 127.0.0.1 -P 4000 -u root -e "SELECT 1" &> /dev/null; do
    sleep 2
done

echo "Feeding PLAIN TEXT init.sql..."
cat init.sql | mysql -h 127.0.0.1 -P 4000 -u root

echo "Verifying Database Content..."
# This will show exactly what is inside the password column
mysql -h 127.0.0.1 -P 4000 -u root -e "USE app_db; SELECT email, password_hash FROM users;"

echo "Restarting API..."
docker restart login-api
echo "DONE."