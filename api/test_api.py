"""
FIFA Nexus AI – API Test Suite
Tests critical REST endpoints and state mutation functions.
Run with: pytest test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from services.state import stadium_state, add_incident, resolve_incident, add_task, add_order

client = TestClient(app)


# ── Health & Root ─────────────────────────────────────────────────────────────

def test_root_returns_200():
    response = client.get("/")
    assert response.status_code == 200
    assert "FIFA Nexus AI" in response.json()["message"]

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_state():
    response = client.get("/api/state")
    assert response.status_code == 200
    data = response.json()
    assert "attendance" in data
    assert "incidents" in data
    assert "tasks" in data
    assert "medical" in data
    assert "transport" in data

# ── Incident Endpoints ─────────────────────────────────────────────────────────

def test_create_incident_valid():
    response = client.post("/api/incidents", json={
        "location": "Gate 4",
        "desc": "Crowd surge detected at turnstiles.",
        "severity": "HIGH"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["location"] == "Gate 4"
    assert data["severity"] == "HIGH"
    assert "id" in data

def test_create_incident_invalid_severity():
    response = client.post("/api/incidents", json={
        "location": "Gate 4",
        "desc": "Test incident",
        "severity": "INVALID_SEVERITY"  # Should fail validation
    })
    assert response.status_code == 422

def test_create_incident_empty_desc():
    response = client.post("/api/incidents", json={
        "location": "Gate 1",
        "desc": "",
        "severity": "LOW"
    })
    assert response.status_code == 422

def test_create_incident_too_long_desc():
    response = client.post("/api/incidents", json={
        "location": "Gate 1",
        "desc": "A" * 600,  # Exceeds max_length=500
        "severity": "LOW"
    })
    assert response.status_code == 422

def test_resolve_incident():
    # Create one first
    create_resp = client.post("/api/incidents", json={
        "location": "Sector B",
        "desc": "Spilled beverage on stairs.",
        "severity": "LOW"
    })
    assert create_resp.status_code == 200
    incident_id = create_resp.json()["id"]
    
    resolve_resp = client.post(f"/api/incidents/{incident_id}/resolve")
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "success"

def test_resolve_nonexistent_incident():
    response = client.post("/api/incidents/999999/resolve")
    assert response.status_code == 404

# ── Task Endpoints ─────────────────────────────────────────────────────────────

def test_create_task_valid():
    response = client.post("/api/tasks", json={
        "title": "Deploy 5 volunteers to Gate 6",
        "location": "Gate 6",
        "priority": "HIGH",
        "category": "VOLUNTEER"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PENDING"

def test_create_task_invalid_priority():
    response = client.post("/api/tasks", json={
        "title": "Test task",
        "location": "Gate 1",
        "priority": "ULTRA",  # Invalid
        "category": "VOLUNTEER"
    })
    assert response.status_code == 422

def test_accept_task():
    create_resp = client.post("/api/tasks", json={
        "title": "Help at first aid station",
        "location": "Medical Bay A",
        "priority": "HIGH",
        "category": "MEDICAL"
    })
    task_id = create_resp.json()["id"]
    
    accept_resp = client.post(f"/api/tasks/{task_id}/accept")
    assert accept_resp.status_code == 200

def test_complete_task():
    create_resp = client.post("/api/tasks", json={
        "title": "Restock water at Gate 2",
        "location": "Gate 2",
        "priority": "MEDIUM",
        "category": "VOLUNTEER"
    })
    task_id = create_resp.json()["id"]
    
    complete_resp = client.post(f"/api/tasks/{task_id}/complete")
    assert complete_resp.status_code == 200

# ── Order Endpoints ─────────────────────────────────────────────────────────────

def test_create_order_valid():
    response = client.post("/api/orders", json={
        "item": "Classic Burger Combo",
        "price": 12.0,
        "location": "Seat 42F"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["item"] == "Classic Burger Combo"
    assert data["status"] == "PREPARING"

def test_create_order_negative_price():
    response = client.post("/api/orders", json={
        "item": "Free item",
        "price": -5.0,  # Invalid
        "location": "Seat 1A"
    })
    assert response.status_code == 422

def test_create_order_excessive_price():
    response = client.post("/api/orders", json={
        "item": "Expensive item",
        "price": 99999.99,  # Exceeds max 1000
        "location": "Seat 1A"
    })
    assert response.status_code == 422

# ── Security Endpoint ─────────────────────────────────────────────────────────

def test_update_threat_level():
    response = client.post("/api/security/threat", json={
        "threat_level": "ELEVATED"
    })
    assert response.status_code == 200
    assert stadium_state["threat_level"] == "ELEVATED"

def test_update_threat_level_invalid():
    response = client.post("/api/security/threat", json={
        "threat_level": "MAXIMUM_DANGER"  # Invalid
    })
    assert response.status_code == 422

# ── Medical Endpoints ─────────────────────────────────────────────────────────

def test_triage_patient():
    response = client.post("/api/medical/triage", json={
        "name": "Patient #201",
        "gate": "Gate 6",
        "condition": "Heat Stroke",
        "severity": "HIGH"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["condition"] == "Heat Stroke"

# ── State Mutation Unit Tests ──────────────────────────────────────────────────

def test_add_incident_state_update():
    before = len(stadium_state["incidents"])
    add_incident("Gate 3", "Test incident for unit test", "LOW")
    after = len(stadium_state["incidents"])
    assert after == before + 1

def test_resolve_incident_state():
    inc = add_incident("Sector A", "Dropped food - cleanup required", "LOW")
    inc_id = inc["id"]
    assert resolve_incident(inc_id) is True
    # Find the incident and check status
    found = next((i for i in stadium_state["incidents"] if i["id"] == inc_id), None)
    assert found is not None
    assert found["status"] == "RESOLVED"

def test_add_task_state():
    before = len(stadium_state["tasks"])
    task = add_task("Unit test task", "Test Location", "LOW", "VOLUNTEER")
    assert task["status"] == "PENDING"
    assert len(stadium_state["tasks"]) == before + 1

def test_add_order_state():
    before = len(stadium_state["orders"])
    order = add_order("Test Snack", 3.50, "Seat 99Z")
    assert order["status"] == "PREPARING"
    assert len(stadium_state["orders"]) == before + 1

# ── Input Sanitization ────────────────────────────────────────────────────────

def test_html_injection_stripped():
    response = client.post("/api/incidents", json={
        "location": "Gate <script>alert('xss')</script> 4",
        "desc": "Test incident with HTML tags",
        "severity": "LOW"
    })
    assert response.status_code == 200
    # Location should have script tags stripped
    assert "<script>" not in response.json()["location"]

def test_volunteer_shift_toggle():
    before = stadium_state["volunteers"]
    response = client.post("/api/volunteer/shift", json={"active": True})
    assert response.status_code == 200
    assert response.json()["volunteers"] == before + 1
