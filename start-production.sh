#!/bin/bash

# Production Startup Script for PM2
# Use this for AWS deployment

echo "Starting Event Access Control System with PM2..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Start Python Face Service
echo "Starting Python Face Recognition Service..."
cd "$SCRIPT_DIR/api"
pm2 start face_service.py --name python-face-service --interpreter python3 --interpreter-args="$SCRIPT_DIR/api/venv/bin/python"

# Start Node.js API
echo "Starting Node.js API..."
cd "$SCRIPT_DIR/server-node"
pm2 start src/server.js --name nodejs-api

# Build and serve React frontend
echo "Building React frontend..."
cd "$SCRIPT_DIR"
npm run build

echo "Starting React frontend..."
pm2 serve dist 5173 --spa --name react-frontend

# Save PM2 configuration
pm2 save

echo ""
echo "================================"
echo "All services started with PM2!"
echo "================================"
echo ""
echo "View status: pm2 status"
echo "View logs: pm2 logs"
echo "Stop all: pm2 stop all"
echo "Restart all: pm2 restart all"
echo ""
