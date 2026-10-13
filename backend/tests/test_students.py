from uuid import uuid4

def setup_class_and_section(client):
    headers = {"Authorization": "Bearer dev-token-admin", "X-School-ID": "school-1"}
    year = client.post("/api/v1/academic/academic-years", headers=headers, json={
        "name": f"2026-2027-{uuid4().hex[:6]}", "start_date": "2026-04-01", "end_date": "2027-03-31", "is_active": True,
    })
    assert year.status_code == 201, year.text
    classroom = client.post("/api/v1/academic/classes", headers=headers, json={
        "academic_year_id": year.json()["id"], "name": "Grade 1", "sort_order": 1,
    })
    assert classroom.status_code == 201, classroom.text
    section = client.post("/api/v1/academic/sections", headers=headers, json={
        "class_id": classroom.json()["id"], "name": "A", "capacity": 30,
    })
    assert section.status_code == 201, section.text
    return headers, year.json(), classroom.json(), section.json()


def student_payload(year, classroom, section, admission_number=None):
    return {
        "academic_year_id": year["id"],
        "class_id": classroom["id"],
        "section_id": section["id"],
        "admission_number": admission_number or f"LPS-{uuid4().hex[:8]}-001",
        "full_name": "Amina Example",
        "date_of_birth": "2018-03-14",
        "gender": "female",
        "admission_date": "2026-04-01",
        "guardian_name": "Nadia Example",
        "guardian_relationship": "Mother",
        "guardian_phone": "+923001234567",
        "address": "Lahore",
        "status": "active",
    }


def test_student_enrollment_search_and_update(client):
    headers, year, classroom, section = setup_class_and_section(client)
    created = client.post("/api/v1/students", headers=headers, json=student_payload(year, classroom, section))
    assert created.status_code == 201, created.text
    assert created.json()["class_name"] == "Grade 1"
    assert created.json()["section_name"] == "A"

    listed = client.get("/api/v1/students?q=Amina&page=1&page_size=10", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["admission_number"] == created.json()["admission_number"]

    updated = client.patch(f"/api/v1/students/{created.json()['id']}", headers=headers, json={"status": "inactive"})
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "inactive"


def test_student_admission_number_unique_per_school(client):
    headers, year, classroom, section = setup_class_and_section(client)
    payload = student_payload(year, classroom, section)
    first = client.post("/api/v1/students", headers=headers, json=payload)
    second = client.post("/api/v1/students", headers=headers, json={**payload, "full_name": "Duplicate Student"})
    assert first.status_code == 201
    assert second.status_code == 409


def test_teacher_can_read_but_not_manage_students(client):
    headers, year, classroom, section = setup_class_and_section(client)
    response = client.post("/api/v1/students", headers={"Authorization": "Bearer dev-token-teacher", "X-School-ID": "school-1"}, json=student_payload(year, classroom, section))
    assert response.status_code == 403


def test_student_relationships_must_belong_to_selected_school(client):
    headers, year, classroom, section = setup_class_and_section(client)
    response = client.post("/api/v1/students", headers=headers, json={**student_payload(year, classroom, section), "section_id": "missing-section"})
    assert response.status_code == 422


def test_invalid_school_context_is_rejected(client):
    response = client.get("/api/v1/students", headers={"Authorization": "Bearer dev-token-admin", "X-School-ID": "school-2"})
    assert response.status_code == 403
