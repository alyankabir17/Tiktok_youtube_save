import time
from typing import Any

_jobs: dict[str, dict[str, Any]] = {}

def create_job(job_id: str) -> dict[str, Any]:
    job = {
        "job_id": job_id,
        "status": "starting",
        "percent": 0.0,
        "speed": "0 B/s",
        "eta": "--:--",
        "downloaded": "0 B",
        "total": "Calculating...",
        "stage": "Connecting to media stream...",
        "download_url": None,
        "filename": None,
        "file_size": None,
        "error": None,
        "updated_at": time.time(),
    }
    _jobs[job_id] = job
    return job

def update_progress(job_id: str, data: dict[str, Any]) -> None:
    if job_id in _jobs:
        _jobs[job_id].update(data)
        _jobs[job_id]["updated_at"] = time.time()
    else:
        _jobs[job_id] = {
            "job_id": job_id,
            "status": "starting",
            "percent": 0.0,
            "speed": "0 B/s",
            "eta": "--:--",
            "downloaded": "0 B",
            "total": "Calculating...",
            "stage": "Processing...",
            "download_url": None,
            "filename": None,
            "file_size": None,
            "error": None,
            "updated_at": time.time(),
            **data
        }

def get_progress(job_id: str) -> dict[str, Any] | None:
    cleanup_old_jobs()
    return _jobs.get(job_id)

def cleanup_old_jobs(max_age_seconds: int = 1800) -> None:
    now = time.time()
    expired = [jid for jid, j in _jobs.items() if now - j.get("updated_at", now) > max_age_seconds]
    for jid in expired:
        _jobs.pop(jid, None)
