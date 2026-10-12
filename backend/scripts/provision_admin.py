import sys
import os
import argparse
import uuid
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.models.school import School
from app.models.user import UserProfile, Role, Permission, SchoolMembership
from app.models.audit import AuditLog

# Standard Roles and their permission matrix
DEFAULT_ROLES = [
    {"name": "admin", "display_name": "School Administrator", "description": "Full administrative control over school operations"},
    {"name": "teacher", "display_name": "Class / Subject Teacher", "description": "Manages class attendance, marks entry, syllabus, and homework"},
    {"name": "accountant", "display_name": "School Accountant", "description": "Generates vouchers, records cash/bank fee collections, and prints receipts"},
    {"name": "staff", "display_name": "General Staff", "description": "General non-teaching school staff with view access"},
]

DEFAULT_PERMISSIONS = [
    # Academics
    {"code": "students:view", "name": "View Students", "module": "academics", "roles": ["admin", "teacher", "accountant"]},
    {"code": "students:manage", "name": "Manage Students & Admissions", "module": "academics", "roles": ["admin"]},
    {"code": "academics:manage", "name": "Manage Classes & Subjects", "module": "academics", "roles": ["admin"]},
    # Attendance
    {"code": "attendance:view", "name": "View Attendance", "module": "attendance", "roles": ["admin", "teacher", "accountant"]},
    {"code": "attendance:record", "name": "Record Student Attendance", "module": "attendance", "roles": ["admin", "teacher"]},
    {"code": "staff_attendance:manage", "name": "Manage Staff Attendance", "module": "attendance", "roles": ["admin"]},
    # Finance
    {"code": "fees:view", "name": "View Invoices & Ledgers", "module": "finance", "roles": ["admin", "accountant"]},
    {"code": "fees:collect", "name": "Record Fee Payments & Print Receipts", "module": "finance", "roles": ["admin", "accountant"]},
    {"code": "fees:structure_manage", "name": "Configure Fee Structures", "module": "finance", "roles": ["admin"]},
    # Examinations
    {"code": "exams:view", "name": "View Examinations", "module": "exams", "roles": ["admin", "teacher"]},
    {"code": "exams:enter_marks", "name": "Enter Exam Marks", "module": "exams", "roles": ["admin", "teacher"]},
    {"code": "exams:publish", "name": "Publish Results & Print Cards", "module": "exams", "roles": ["admin"]},
    # Administration
    {"code": "settings:manage", "name": "Manage School Settings", "module": "admin", "roles": ["admin"]},
    {"code": "users:manage", "name": "Manage Staff Users & Roles", "module": "admin", "roles": ["admin"]},
]


def bootstrap_roles_and_permissions(db):
    """Ensures standard roles and granular permissions exist and are mapped."""
    print("[1/4] Ensuring standard roles and permissions exist...")
    
    created_roles = {}
    for r_data in DEFAULT_ROLES:
        role = db.query(Role).filter(Role.name == r_data["name"]).first()
        if not role:
            role = Role(
                name=r_data["name"],
                display_name=r_data["display_name"],
                description=r_data["description"],
                is_system=True,
            )
            db.add(role)
            db.flush()
        created_roles[role.name] = role

    created_perms = {}
    for p_data in DEFAULT_PERMISSIONS:
        perm = db.query(Permission).filter(Permission.code == p_data["code"]).first()
        if not perm:
            perm = Permission(
                code=p_data["code"],
                name=p_data["name"],
                module=p_data["module"],
            )
            db.add(perm)
            db.flush()
        created_perms[perm.code] = perm

        # Map to roles
        for r_name in p_data["roles"]:
            role_obj = created_roles.get(r_name)
            if role_obj and perm not in role_obj.permissions:
                role_obj.permissions.append(perm)

    db.commit()
    print("  -> Roles & permissions successfully verified.")
    return created_roles


def provision_admin(
    email: str,
    name: str,
    school_name: str,
    school_code: str,
    city: str = "Lahore",
    auth_sub: str = None,
):
    """Idempotently provisions or updates the school and assigns the administrator."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        roles = bootstrap_roles_and_permissions(db)

        # 2. Create or fetch School
        print(f"[2/4] Setting up school: '{school_name}' ({school_code})...")
        school = db.query(School).filter(School.code == school_code).first()
        if not school:
            school = School(
                name=school_name,
                code=school_code,
                city=city,
                currency="PKR",
                timezone="Asia/Karachi",
                is_active=True,
            )
            db.add(school)
            db.flush()
            print(f"  -> Created new school ID: {school.id}")
        else:
            print(f"  -> Found existing school ID: {school.id}")

        # 3. Create or fetch UserProfile
        user_id = auth_sub or f"usr-{uuid.uuid4().hex[:16]}"
        print(f"[3/4] Setting up administrator profile: {email}...")
        user = db.query(UserProfile).filter(UserProfile.email == email).first()
        if not user:
            user = UserProfile(
                id=user_id,
                email=email,
                full_name=name,
                is_active=True,
                is_superadmin=True,
            )
            db.add(user)
            db.flush()
            print(f"  -> Created user profile with ID: {user.id}")
        else:
            user.full_name = name
            user.is_superadmin = True
            db.flush()
            print(f"  -> Updated user profile ID: {user.id}")

        # 4. Assign Admin Membership
        print(f"[4/4] Assigning admin role for {school.name}...")
        admin_role = roles["admin"]
        membership = (
            db.query(SchoolMembership)
            .filter(
                SchoolMembership.user_id == user.id,
                SchoolMembership.school_id == school.id,
            )
            .first()
        )
        if not membership:
            membership = SchoolMembership(
                user_id=user.id,
                school_id=school.id,
                role_id=admin_role.id,
                is_active=True,
            )
            db.add(membership)
            print("  -> Admin membership created.")
        else:
            membership.role_id = admin_role.id
            membership.is_active = True
            print("  -> Admin membership reaffirmed.")

        # Audit log entry
        audit = AuditLog(
            school_id=school.id,
            user_id=user.id,
            action="ADMIN_PROVISIONED",
            entity_type="SchoolMembership",
            entity_id=membership.id,
            changes={"email": email, "school_code": school_code, "role": "admin"},
        )
        db.add(audit)
        db.commit()

        print("\n=========================================================")
        print(" SUCCESS: School & Administrator Provisioned Successfully")
        print("=========================================================")
        print(f" School Name : {school.name}")
        print(f" School Code : {school.code}")
        print(f" School ID   : {school.id}")
        print(f" Admin Email : {user.email}")
        print(f" Admin ID    : {user.id}")
        print(f" Role        : admin (Full Privileges)")
        print(f" Currency    : PKR")
        print(f" Timezone    : Asia/Karachi")
        print("=========================================================\n")

        return school, user

    except Exception as e:
        db.rollback()
        print(f"Error provisioning admin: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Securely provision initial school and administrator")
    parser.add_argument("--email", default="admin@schools.pk", help="Admin email address")
    parser.add_argument("--name", default="Administrator", help="Admin full name")
    parser.add_argument("--school-name", default="Lahore Model Academy", help="School name")
    parser.add_argument("--school-code", default="LMA-01", help="Unique school code")
    parser.add_argument("--city", default="Lahore", help="School city")
    parser.add_argument("--auth-sub", default=None, help="Supabase Auth User ID (sub UUID) if already created in Supabase")

    args = parser.parse_args()
    provision_admin(
        email=args.email,
        name=args.name,
        school_name=args.school_name,
        school_code=args.school_code,
        city=args.city,
        auth_sub=args.auth_sub,
    )
