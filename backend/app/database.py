from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from app.config import settings

# Simple SSL context for Render PostgreSQL
database_url = settings.DATABASE_URL

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args={
        "ssl": "allow",  # Changed from strict SSL context
    },
    poolclass=NullPool,
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