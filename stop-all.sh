#!/bin/bash

# Event Access Control - Stop All Services

echo "Stopping all services..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.pids"

if [ -f "$PID_FILE" ]; then
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping process $pid..."
            kill $pid 2>/dev/null
        fi
    done < "$PID_FILE"
    rm "$PID_FILE"
    echo "All services stopped!"
else
    echo "No PID file found. Services may not be running."
    echo "Attempting to kill services by port..."
    
    # Kill by port
    fuser -k 8000/tcp 2>/dev/null
    fuser -k 3001/tcp 2>/dev/null
    fuser -k 5173/tcp 2>/dev/null
    
    echo "Done!"
fi
