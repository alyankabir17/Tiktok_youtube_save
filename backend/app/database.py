from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import DeclarativeBase  # pyright: ignore[reportMissingImports]
from sqlalchemy.pool import NullPool  # pyright: ignore[reportMissingImports]
from app.config import settings
import ssl

# Create SSL context for asyncpg
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_REQUIRED

# Remove sslmode from URL if present
database_url = settings.DATABASE_URL.replace("?sslmode=require", "")

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args={
        "ssl": ssl_context,
    },
    poolclass=NullPool,  # Recommended for Render
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()