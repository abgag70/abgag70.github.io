#!/bin/bash

# Install Python and pip
apt install python3 python3-pip -y

# Install system dependencies
apt install nginx -y

# Install Django and other project requirements
pip install -r ./requirements.txt

touch "/etc/nginx/sites-available/viosissite"

echo "server {
            listen 80;
            server_name vio-sis.louvesaintjeu.com;

            location / {
                proxy_pass http://0.0.0.0:8000;
                proxy_set_header Host \$host;
                proxy_set_header X-Real-IP \$remote_addr;
                proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto \$scheme;
            }

        }" > "/etc/nginx/sites-available/viosissite"

ln -sf "/etc/nginx/sites-available/viosissite" "/etc/nginx/sites-enabled/"

# Restat Nginx
service nginx restart

# Replaced by gunicorn
nohup python3 main.py > server.logs 2>&1 &

tail -f server.logs
