FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /tmp/downloads

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "[IP_ADDRESS]", "--port", "8000"]
