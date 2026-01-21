#!/bin/bash

# Script to safely restart backend and frontend servers
# Prevents port conflicts by killing existing processes first

echo "=========================================="
echo "  Restarting Backend & Frontend Servers"
echo "=========================================="
echo ""

# Kill existing processes
echo "1. Killing existing servers..."
lsof -ti:5001 | xargs kill -9 2>/dev/null && echo "   ✓ Killed backend processes" || echo "   ℹ No backend processes found"
lsof -ti:3000,3001,5173 | xargs kill -9 2>/dev/null && echo "   ✓ Killed frontend processes" || echo "   ℹ No frontend processes found"
sleep 2

# Start backend
echo ""
echo "2. Starting backend server..."
cd "$(dirname "$0")/backend"
python3 server.py > server.log 2>&1 &
BACKEND_PID=$!
echo "   ✓ Backend started (PID: $BACKEND_PID)"

# Start frontend
echo ""
echo "3. Starting frontend server..."
cd "$(dirname "$0")/frontend"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✓ Frontend started (PID: $FRONTEND_PID)"

# Wait and verify
echo ""
echo "4. Verifying servers..."
sleep 4

if lsof -ti:5001 > /dev/null 2>&1; then
    echo "   ✓ Backend is running on http://localhost:5001"
    curl -s http://localhost:5001/health > /dev/null 2>&1 && echo "   ✓ Backend health check passed"
else
    echo "   ✗ Backend failed to start (check backend/server.log)"
fi

if lsof -ti:3000,3001,5173 > /dev/null 2>&1; then
    FRONTEND_PORT=$(lsof -ti:3000,3001,5173 2>/dev/null | head -1 | xargs lsof -p 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
    echo "   ✓ Frontend is running on http://localhost:${FRONTEND_PORT:-3000}"
else
    echo "   ✗ Frontend failed to start (check frontend/frontend.log)"
fi

echo ""
echo "=========================================="
echo "  Servers restarted successfully!"
echo "=========================================="
echo ""
echo "Logs:"
echo "  Backend:  tail -f backend/server.log"
echo "  Frontend: tail -f frontend/frontend.log"
echo ""
echo "To stop servers:"
echo "  lsof -ti:5001,3000,3001,5173 | xargs kill -9"
echo ""
