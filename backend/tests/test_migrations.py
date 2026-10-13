from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text


def test_migrations_create_schema_from_empty_database():
    backend_dir = Path(__file__).resolve().parents[1]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    engine = create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            config.attributes["connection"] = connection
            command.upgrade(config, "head")
            tables = set(inspect(connection).get_table_names())
            assert {"schools", "user_profiles", "academic_years", "academic_classes", "sections", "subjects", "students"} <= tables
            assert connection.execute(text("select version_num from alembic_version")).scalar_one() == "20261013_0002"
    finally:
        engine.dispose()
