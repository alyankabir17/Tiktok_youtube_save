from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from app.config import settings

raw_url = str(settings.DATABASE_URL or "").strip()
if raw_url.startswith("postgres://"):
    database_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
    database_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    database_url = raw_url

connect_args = {}
if "localhost" not in database_url and "127.0.0.1" not in database_url:
    connect_args["ssl"] = "allow"

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args=connect_args,
    poolclass=NullPool,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Auto database table initialization skipped/failed: {e}")

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()