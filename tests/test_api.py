import copy
import urllib.parse
import pytest

# Ensure src is importable
import sys
sys.path.insert(0, "src")

from app import app, activities
from fastapi.testclient import TestClient

client = TestClient(app)

@pytest.fixture(autouse=True)
def restore_activities():
    """Restore the in-memory activities state before each test"""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(original))


def test_get_activities_returns_dict():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Ensure at least one activity exists and has participants list
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_prevent_duplicates():
    activity = "Chess Club"
    email = "tester@mergington.edu"

    # Sign up
    url = f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}"
    res = client.post(url)
    assert res.status_code == 200
    assert email in res.json()["message"]

    # Participant should now appear in the activity
    participants_res = client.get(f"/activities/{urllib.parse.quote(activity)}/participants")
    assert participants_res.status_code == 200
    assert email in participants_res.json()["participants"]

    # Signing up again should fail with 400
    res2 = client.post(url)
    assert res2.status_code == 400


def test_remove_participant_and_errors():
    activity = "Programming Class"
    email = "removable@mergington.edu"

    # Ensure participant exists by signing up
    signup_url = f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}"
    r = client.post(signup_url)
    assert r.status_code == 200

    # Remove the participant
    delete_url = f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}"
    d = client.delete(delete_url)
    assert d.status_code == 200
    assert "Removed" in d.json().get("message", "")

    # Removing again should return 404
    d2 = client.delete(delete_url)
    assert d2.status_code == 404


def test_get_participants_endpoint():
    activity = "Drama Club"
    res = client.get(f"/activities/{urllib.parse.quote(activity)}/participants")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data.get("participants"), list)
