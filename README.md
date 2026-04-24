# 🎬 VideoSave - TikTok & YouTube Downloader

A full-stack web application for downloading TikTok and YouTube videos without watermarks.

## ✨ Features

- 📥 Download TikTok videos without watermark
- 🎵 Download YouTube videos in multiple qualities (360p - 4K)
- 🎧 Convert videos to MP3 audio
- 👤 User authentication and download history
- 🚀 Fast async downloads with progress tracking
- 🎨 Modern dark-mode UI with Tailwind CSS
- 📱 Mobile-responsive design

## 🏗️ Tech Stack

### Frontend
- React 19 + Vite 7
- TypeScript
- Tailwind CSS 4 + shadcn/ui
- TanStack Query (React Query)
- Wouter (routing)
- Framer Motion (animations)

### Backend
- FastAPI (Python)
- PostgreSQL + SQLAlchemy
- Redis (rate limiting)
- yt-dlp (video downloading)
- JWT authentication
- Alembic (migrations)

## 🚀 Quick Start

### Prerequisites

Install required software:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm postgresql redis-server ffmpeg

# Install pnpm
npm install -g pnpm
```

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd videosave

# Run the automated setup and launch script
./RUN_PROJECT.sh
```

This script will:
- ✅ Check and start Redis
- ✅ Create PostgreSQL database
- ✅ Set up Python virtual environment
- ✅ Install all dependencies
- ✅ Run database migrations
- ✅ Start both backend and frontend

### Option 2: Manual Setup

#### 1. Database Setup
```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE videosave;
CREATE USER videosave_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE videosave TO videosave_user;
\q
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install

# Start frontend
pnpm dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
.
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic (TikTok, YouTube)
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Rate limiting, CORS
│   │   └── utils/          # Helper functions
│   ├── alembic/            # Database migrations
│   ├── .env                # Backend configuration
│   └── requirements.txt
│
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   └── lib/            # Hooks, utils
│   ├── .env.local          # Frontend configuration
│   └── package.json
│
└── lib/                    # Shared libraries
    └── api-client-react/   # Generated API client
```

## 🔧 Configuration

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://videosave_user:password@localhost:5432/videosave
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-super-secret-key-change-this
ALLOWED_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
PORT=3000
BASE_PATH=/
```

## 🧪 Testing

### Test Backend Health
```bash
curl http://localhost:8000/api/health
```

### Test Video Info Endpoint
```bash
curl -X POST http://localhost:8000/api/download/info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## 📝 API Endpoints

### Download
- `POST /api/download/info` - Get video metadata
- `POST /api/download/start` - Start download
- `GET /api/download/file/{job_id}` - Serve downloaded file
- `GET /api/download/stats` - Get download statistics

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### History
- `GET /api/history` - Get download history
- `DELETE /api/history/{id}` - Delete history item

## 🐛 Troubleshooting

### Redis Connection Error
```bash
# Start Redis
sudo systemctl start redis
# Or manually
redis-server --daemonize yes
```

### PostgreSQL Connection Error
```bash
# Start PostgreSQL
sudo systemctl start postgresql
```

### FFmpeg Not Found
```bash
# Install FFmpeg
sudo apt install ffmpeg
```

### Port Already in Use
```bash
# Change ports in .env files
# Backend: Change uvicorn port
# Frontend: Change PORT in .env.local
```

## 📚 Documentation

- [Complete Setup Guide](START_PROJECT.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Migration Complete](MIGRATION_COMPLETE.md)

## 🔐 Security Notes

**Before deploying to production:**

1. Generate a strong SECRET_KEY:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. Update DATABASE_URL with a strong password

3. Set proper ALLOWED_ORIGINS in backend/.env

4. Enable HTTPS for both frontend and backend

5. Review rate limiting settings

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Legal Disclaimer

This tool is for educational purposes only. Users are responsible for complying with the terms of service of TikTok, YouTube, and other platforms. Downloading copyrighted content without permission may be illegal in your jurisdiction.

---

**Made with ❤️ using FastAPI, React, and yt-dlp**
