# 🚀 VideoSave - Complete Startup Guide

## Prerequisites Check

### Required Software
- ✅ Python 3.11+ 
- ✅ Node.js 18+ & pnpm
- ✅ PostgreSQL 14+
- ⚠️  Redis (required for rate limiting)
- ⚠️  FFmpeg (required for video processing)

### Quick Install Missing Dependencies

```bash
# Install Redis
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Install FFmpeg
sudo apt install ffmpeg

# Verify installations
redis-cli ping  # Should return "PONG"
ffmpeg -version
psql --version
python3 --version
node --version
pnpm --version
```

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In psql shell:
CREATE DATABASE videosave;
CREATE USER videosave_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE videosave TO videosave_user;
\q
```

### 2. Update Backend .env

Edit `backend/.env` and update the DATABASE_URL:
```env
DATABASE_URL=postgresql+asyncpg://videosave_user:your_password_here@localhost:5432/videosave
```

### 3. Run Database Migrations

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
```

## 📦 Install Dependencies

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
pnpm install
```

## 🏃 Running the Project

### Option 1: Run Both Services (Recommended)

Open 2 terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # If not already activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

### Option 2: Using Docker (Alternative)

```bash
# Start all services (PostgreSQL, Redis, Backend)
cd backend
docker-compose up --build

# In another terminal, start frontend
cd frontend
pnpm dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🧪 Testing the Setup

### 1. Check Backend Health
```bash
curl http://localhost:8000/api/health
# Should return: {"status":"ok","version":"1.0.0","timestamp":"..."}
```

### 2. Test Video Info Endpoint
```bash
curl -X POST http://localhost:8000/api/download/info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 3. Open Frontend
Navigate to http://localhost:3000 and try downloading a video!

## 🐛 Troubleshooting

### Backend won't start

**Error: "connection refused" (PostgreSQL)**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**Error: "connection refused" (Redis)**
```bash
# Check if Redis is running
sudo systemctl status redis
sudo systemctl start redis
```

**Error: "ModuleNotFoundError"**
```bash
# Make sure virtual environment is activated
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't start

**Error: "Cannot find module"**
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Error: "PORT already in use"**
```bash
# Change PORT in frontend/.env.local
PORT=3001
```

### Downloads fail

**Error: "FFmpeg not found"**
```bash
sudo apt install ffmpeg
# Or on macOS: brew install ffmpeg
```

**Error: "Rate limit exceeded"**
- Redis might not be running
- Check `backend/.env` REDIS_URL is correct
- Start Redis: `sudo systemctl start redis`

### CORS errors in browser

Make sure `backend/.env` has:
```env
ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

## 📁 Project Structure

```
.
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic (TikTok, YouTube)
│   │   ├── models/         # Database models
│   │   └── middleware/     # Rate limiting, CORS
│   ├── alembic/            # Database migrations
│   ├── .env                # Backend config (created)
│   └── requirements.txt
│
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   └── lib/            # Hooks, utils
│   ├── .env.local          # Frontend config (created)
│   └── package.json
│
└── lib/                    # Shared libraries
    ├── api-client-react/   # Generated API client
    └── api-spec/           # OpenAPI specification
```

## 🔐 Security Notes

### Before Production:

1. **Change SECRET_KEY** in `backend/.env`:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Update DATABASE_URL** with strong password

3. **Set proper ALLOWED_ORIGINS** in `backend/.env`

4. **Enable HTTPS** for both frontend and backend

5. **Set up proper rate limiting** (currently 30 req/hour for anonymous)

## 📊 Monitoring

### Check Logs

**Backend:**
```bash
# Logs are printed to console when running with --reload
# For production, use: uvicorn app.main:app --log-config logging.conf
```

**Database:**
```bash
# Check active connections
sudo -u postgres psql -d videosave -c "SELECT * FROM pg_stat_activity;"
```

**Redis:**
```bash
# Monitor Redis
redis-cli monitor
```

## 🎯 Next Steps

1. ✅ Start backend and frontend
2. ✅ Test downloading a YouTube video
3. ✅ Test downloading a TikTok video
4. ✅ Create an account and check history
5. 📝 Customize the UI/branding
6. 🚀 Deploy to production

## 🆘 Need Help?

- Check `backend/app/main.py` for backend entry point
- Check `frontend/src/App.tsx` for frontend routing
- API documentation: http://localhost:8000/docs
- Project structure: See `PROJECT_STRUCTURE.md`

---

**Status**: ✅ All files created, ready to run!
