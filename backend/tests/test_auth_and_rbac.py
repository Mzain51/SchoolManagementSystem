def test_unauthenticated_request_blocked(client):
    """Requests without token to protected endpoints must be rejected."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.json()["detail"]


def test_authenticated_admin_context(client):
    """Admin user can fetch profile, membership, and permissions."""
    headers = {"Authorization": "Bearer dev-token-admin"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@schools.pk"
    assert data["active_role"] == "admin"
    assert data["active_school_id"] == "school-1"
    assert "students:manage" in data["permissions"]
    assert "fees:collect" in data["permissions"]


def test_authenticated_teacher_context(client):
    """Teacher user only receives teacher permissions and roles."""
    headers = {"Authorization": "Bearer dev-token-teacher"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "teacher@schools.pk"
    assert data["active_role"] == "teacher"
    assert "attendance:record" in data["permissions"]
    assert "fees:structure_manage" not in data["permissions"]


def test_school_tenant_isolation(client):
    """Users cannot access details of schools they do not belong to."""
    # Teacher belongs only to school-1, should not access school-2
    headers = {"Authorization": "Bearer dev-token-teacher"}
    response = client.get("/api/v1/schools/school-2", headers=headers)
    assert response.status_code == 403
    assert "Access forbidden" in response.json()["detail"]

    # Can access school-1
    response = client.get("/api/v1/schools/school-1", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == "school-1"


def test_dashboard_stats_endpoint(client):
    """Admin can access verified operational metrics for their school."""
    headers = {
        "Authorization": "Bearer dev-token-admin",
        "X-School-ID": "school-1",
    }
    response = client.get("/api/v1/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["school_id"] == "school-1"
    assert data["currency"] == "PKR"
    assert "total_teachers" in data
    assert "recent_activities" in data
    assert "fee_collection_trend" in data
