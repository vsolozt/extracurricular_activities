import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_success():
    email = "nuevo@mergington.edu"
    activity = "Chess Club"
    # Asegurarse de que el email no está ya inscrito
    client.post(f"/activities/{activity}/remove?email={email}")
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert f"Signed up {email}" in response.json()["message"]


def test_signup_duplicate():
    email = "michael@mergington.edu"
    activity = "Chess Club"
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]


def test_signup_activity_not_found():
    response = client.post("/activities/NoExiste/signup?email=alguien@mergington.edu")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]


def test_remove_participant():
    email = "quitar@mergington.edu"
    activity = "Chess Club"
    # Primero lo añadimos
    client.post(f"/activities/{activity}/signup?email={email}")
    # Ahora lo quitamos
    response = client.post(f"/activities/{activity}/remove?email={email}")
    assert response.status_code == 200
    assert f"Removed {email}" in response.json()["message"]


def test_remove_not_found():
    response = client.post("/activities/Chess Club/remove?email=noexiste@mergington.edu")
    assert response.status_code == 404
    assert "Participant not found" in response.json()["detail"]


def test_signup_max_participants():
    activity = "Basketball Team"
    # Llenar la actividad
    for i in range(15):
        email = f"max{i}@mergington.edu"
        client.post(f"/activities/{activity}/signup?email={email}")
    # Intentar inscribir uno más
    response = client.post(f"/activities/{activity}/signup?email=extra@mergington.edu")
    assert response.status_code == 400
    assert "No hay plazas disponibles" in response.json()["detail"]
