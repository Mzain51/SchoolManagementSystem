import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app
from app.models.school import School
from app.models.user import UserProfile, Role, Permission, SchoolMembership
from scripts.provision_admin import bootstrap_roles_and_permissions

# In-memory SQLite engine for tests
TEST_DB_URL = "sqlite:///./test_sms.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    bootstrap_roles_and_permissions(db)
    
    # Create test school
    school1 = School(
        id="school-1",
        name="Lahore Public School",
        code="LPS-01",
        city="Lahore",
        currency="PKR",
        timezone="Asia/Karachi",
    )
    school2 = School(
        id="school-2",
        name="Karachi Grammar School",
        code="KGS-01",
        city="Karachi",
        currency="PKR",
        timezone="Asia/Karachi",
    )
    db.add(school1)
    db.add(school2)

    # Create admin user
    admin_user = UserProfile(
        id="dev-admin-id",
        email="admin@schools.pk",
        full_name="M. Admin",
        is_active=True,
        is_superadmin=False,
    )
    # Create teacher user
    teacher_user = UserProfile(
        id="dev-teacher-id",
        email="teacher@schools.pk",
        full_name="Tariq Teacher",
        is_active=True,
        is_superadmin=False,
    )
    db.add(admin_user)
    db.add(teacher_user)
    db.flush()

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    teacher_role = db.query(Role).filter(Role.name == "teacher").first()

    # Assign Admin to School 1
    m1 = SchoolMembership(
        user_id=admin_user.id,
        school_id=school1.id,
        role_id=admin_role.id,
        is_active=True,
    )
    # Assign Teacher to School 1
    m2 = SchoolMembership(
        user_id=teacher_user.id,
        school_id=school1.id,
        role_id=teacher_role.id,
        is_active=True,
    )
    db.add(m1)
    db.add(m2)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()
    try:
        if os.path.exists("./test_sms.db"):
            os.remove("./test_sms.db")
    except Exception:
        pass


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
