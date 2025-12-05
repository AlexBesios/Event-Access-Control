#!/bin/bash

# Event Access Control - Linux Startup Script
# Start all services for Ubuntu/Linux

echo "================================"
echo "Event Access Control System"
echo "Starting all services..."
echo "================================"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Python Face Recognition Microservice
echo ""
echo "Starting Python Face Recognition Microservice on port 8000..."
cd "$SCRIPT_DIR/api"
source venv/bin/activate
python3 face_service.py &
PYTHON_PID=$!
echo "Python service started (PID: $PYTHON_PID)"

# Wait for Python service to start
sleep 2

# Start Node.js API Server
echo ""
echo "Starting Node.js API Server on port 3001..."
cd "$SCRIPT_DIR/server-node"
npm start &
NODE_PID=$!
echo "Node.js service started (PID: $NODE_PID)"

# Wait for Node.js service to start
sleep 3

# Start React Frontend
echo ""
echo "Starting React Frontend on port 5173..."
cd "$SCRIPT_DIR"
npm run dev &
REACT_PID=$!
echo "React frontend started (PID: $REACT_PID)"

echo ""
echo "================================"
echo "All services started!"
echo "================================"
echo "Python API:  http://localhost:8000"
echo "Node.js API: http://localhost:3001"
echo "React App:   http://localhost:5173"
echo ""
echo "Process IDs:"
echo "  Python: $PYTHON_PID"
echo "  Node.js: $NODE_PID"
echo "  React: $REACT_PID"
echo ""
echo "To stop all services, run: ./stop-all.sh"
echo "Or press Ctrl+C and kill the processes manually"
echo ""

# Save PIDs to file for stop script
echo "$PYTHON_PID" > "$SCRIPT_DIR/.pids"
echo "$NODE_PID" >> "$SCRIPT_DIR/.pids"
echo "$REACT_PID" >> "$SCRIPT_DIR/.pids"

# Keep script running
wait
