Kill both:
lsof -ti:5001,3000,3001,5173 | xargs kill -9 2>/dev/null

Start both:
cd "/Users/pratikkumar/Desktop/Projects/EMD Final/backend" && python3 server.py > server.log 2>&1 & cd "/Users/pratikkumar/Desktop/Projects/EMD Final/frontend" && npm run dev > frontend.log 2>&1 &

Check status:
echo "Backend:" && (lsof -ti:5001 > /dev/null && echo "✓ Running on port 5001" || echo "✗ Not running") && echo "Frontend:" && (lsof -ti:3000,3001,5173 > /dev/null && echo "✓ Running" || echo "✗ Not running")


./restart_servers.sh

./stop_servers.sh