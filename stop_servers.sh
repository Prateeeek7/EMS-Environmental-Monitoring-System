#!/bin/bash

# Script to stop all backend and frontend servers

echo "Stopping all servers..."

# Kill backend
lsof -ti:5001 | xargs kill -9 2>/dev/null && echo "✓ Stopped backend" || echo "ℹ No backend process found"

# Kill frontend
lsof -ti:3000,3001,5173 | xargs kill -9 2>/dev/null && echo "✓ Stopped frontend" || echo "ℹ No frontend process found"

echo ""
echo "All servers stopped."
