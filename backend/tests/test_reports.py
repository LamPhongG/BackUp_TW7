import pytest
from fastapi.testclient import TestClient

def test_reports_access(client: TestClient, employee_headers: dict, hr_headers: dict):
    r = client.get("/api/reports/role-coverage", headers=employee_headers)
    assert r.status_code == 403
    r = client.get("/api/reports/role-coverage", headers=hr_headers)
    assert r.status_code == 200

def test_reports_data(client: TestClient, hr_headers: dict):
    # Just basic checks that endpoints return lists
    r = client.get("/api/reports/role-coverage", headers=hr_headers)
    assert isinstance(r.json(), list)

    r = client.get("/api/reports/quiz-analytics", headers=hr_headers)
    assert isinstance(r.json(), list)

    r = client.get("/api/reports/documents", headers=hr_headers)
    assert isinstance(r.json(), list)

    r = client.get("/api/reports/alerts", headers=hr_headers)
    assert isinstance(r.json(), list)
