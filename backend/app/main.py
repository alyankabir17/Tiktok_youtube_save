from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.routers import health, auth, download, history
from app.config import settings

app = FastAPI(title="VideoDownloader API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Exception handler AFTER middleware
@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else None
    message = "Invalid request"
    if first:
        message = str(first.get("msg") or message)
    return JSONResponse(status_code=422, content={"message": message})

# Routers last
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(download.router)
app.include_router(history.router)