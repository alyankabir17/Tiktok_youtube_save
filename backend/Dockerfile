FROM python:3.11.9-slim

# Install FFmpeg (required by yt-dlp)
RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends ffmpeg ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Suppress pip warnings
ENV PIP_NO_WARN_SCRIPT_LOCATION=1

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --disable-pip-version-check

# Copy app
COPY . .

# Create temp directory
RUN mkdir -p /tmp/downloads

# Start app WITHOUT running migrations
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]