#!/bin/bash

echo "🔍 VideoSave Project Setup Checker"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

check_service() {
    if systemctl is-active --quiet $1 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 is running"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $1 is not running (may need to start it)"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        return 1
    fi
}

echo "📦 Checking Required Software..."
check_command python3
check_command node
check_command pnpm
check_command psql
check_command redis-cli
check_command ffmpeg

echo ""
echo "🔧 Checking Services..."
check_service postgresql
check_service redis

echo ""
echo "📁 Checking Project Structure..."
check_dir "backend"
check_dir "backend/app"
check_dir "backend/alembic"
check_dir "frontend"
check_dir "frontend/src"
check_dir "lib"

echo ""
echo "📄 Checking Configuration Files..."
check_file "backend/.env"
check_file "backend/requirements.txt"
check_file "frontend/.env.local"
check_file "frontend/package.json"

echo ""
echo "🐍 Checking Python Virtual Environment..."
if [ -d "backend/venv" ] || [ -d "backend/.venv" ]; then
    echo -e "${GREEN}✓${NC} Python virtual environment exists"
else
    echo -e "${YELLOW}⚠${NC} Python virtual environment not found (run: cd backend && python3 -m venv venv)"
fi

echo ""
echo "📦 Checking Node Modules..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed (run: cd frontend && pnpm install)"
fi

echo ""
echo "🗄️  Checking Database..."
if psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw videosave; then
    echo -e "${GREEN}✓${NC} Database 'videosave' exists"
else
    echo -e "${YELLOW}⚠${NC} Database 'videosave' not found (see START_PROJECT.md for setup)"
fi

echo ""
echo "=================================="
echo "📋 Summary:"
echo ""
echo "If you see any ${RED}✗${NC} or ${YELLOW}⚠${NC} above, check START_PROJECT.md for setup instructions."
echo ""
echo "To start the project:"
echo "  1. Terminal 1: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  2. Terminal 2: cd frontend && pnpm dev"
echo ""
echo "Then open: http://localhost:3000"
