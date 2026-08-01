#!/bin/bash

echo "🚀 VideoSave - Project Launcher"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Free up ports 8000 and 3000 if currently occupied
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true

# Check if Redis is running
if ! systemctl is-active --quiet redis 2>/dev/null && ! pgrep redis-server > /dev/null; then
    echo -e "${YELLOW}⚠ Redis is not running${NC}"
    echo "  Starting Redis..."
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes
        echo -e "${GREEN}✓ Redis started${NC}"
    else
        echo -e "${YELLOW}⚠ Redis not installed. The app will work but rate limiting will be disabled.${NC}"
    fi
fi

# Check Python venv
if [ ! -d "backend/venv" ] && [ ! -d "backend/.venv" ]; then
    echo -e "${YELLOW}⚠ Python virtual environment not found${NC}"
    echo "  Creating virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    # Update yt-dlp to latest in venv if venv exists
    cd backend
    source venv/bin/activate 2>/dev/null || source .venv/bin/activate 2>/dev/null
    pip install -U yt-dlp >/dev/null 2>&1 || true
    cd ..
fi

# Run migrations (optional if DB is running)
echo -e "${BLUE}📊 Checking database migrations...${NC}"
cd backend
source venv/bin/activate 2>/dev/null || source .venv/bin/activate 2>/dev/null
alembic upgrade head 2>/dev/null || echo -e "${YELLOW}⚠ DB migration skipped (PostgreSQL offline or unconfigured). Backend will still run.${NC}"
cd ..
echo -e "${GREEN}✓ Backend check complete${NC}"

# Install frontend dependencies using npm
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠ Frontend dependencies not installed${NC}"
    echo "  Installing dependencies..."
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

echo ""
echo -e "${GREEN}✓ All checks passed!${NC}"
echo ""
echo "================================"
echo "🎯 Starting VideoSave..."
echo "================================"
echo ""
echo -e "${BLUE}Backend:${NC} http://localhost:8000"
echo -e "${BLUE}Frontend:${NC} http://localhost:3000 (or http://localhost:3001)"
echo -e "${BLUE}API Docs:${NC} http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    fuser -k 8000/tcp 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd backend
source venv/bin/activate 2>/dev/null || source .venv/bin/activate 2>/dev/null
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
