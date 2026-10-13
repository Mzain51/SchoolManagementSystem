from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Engine configuration with dialect-specific settings
connect_args = {}
pool_kwargs = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Production PostgreSQL pool settings for Supabase
    # Disable prepared statements for Supabase transaction pooler (PgBouncer)
    connect_args = {"prepare_threshold": None, "connect_timeout": 10}
    pool_kwargs = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **pool_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database session with automatic lifecycle management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
