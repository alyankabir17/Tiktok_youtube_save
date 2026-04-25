FROM python:3.11.9-slim

# Install FFmpeg (required by yt-dlp)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Create temp directory
RUN mkdir -p /tmp/downloads

# Run migrations and start app
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 10000