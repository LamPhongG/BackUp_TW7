import smtplib
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.models import User

INVITE = {"job_position_id": "cs-exec", "department_code": "Customer Support"}


class FakeSMTP:
    sent: list = []
    fail = False

    def __init__(self, host, port, timeout):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def starttls(self):
        if FakeSMTP.fail:
            raise smtplib.SMTPException("relay refused")

    def login(self, user, password):
        pass

    def send_message(self, msg):
        FakeSMTP.sent.append(msg)


@pytest.fixture
def smtp(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "smtp_host", "smtp.test")
    monkeypatch.setattr(settings, "smtp_user", "noreply@fourangrybirds.vn")
    monkeypatch.setattr(settings, "smtp_password", "secret")
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    FakeSMTP.sent = []
    FakeSMTP.fail = False
    return FakeSMTP


def _register_form(email: str, **extra) -> dict:
    return {"name": "Minh Anh", "email": email, "password": "Welcome#2026", **extra}


def _body(msg) -> str:
    return "".join(part.get_content() for part in msg.iter_parts())


def test_invite_without_smtp_still_gives_a_link(client, hr_headers):
    res = client.post("/api/invite", json={**INVITE, "invited_email": "new@fourangrybirds.vn"}, headers=hr_headers)

    assert res.status_code == 201
    body = res.json()
    assert body["email_sent"] is False
    assert body["is_valid"] is True
    assert body["register_url"].endswith(f"/register/{body['token']}")
    assert body["job_position_name"] == "Nhân viên Chăm sóc khách hàng"
    assert body["job_position_name_en"] == "Customer Support Executive"
    assert body["department_name_en"] == "Customer Support"


def test_only_hr_manages_invites(client, reviewer_headers, employee_headers):
    assert client.post("/api/invite", json=INVITE, headers=reviewer_headers).status_code == 403
    assert client.get("/api/invite", headers=employee_headers).status_code == 403
    assert client.post("/api/invite", json=INVITE).status_code == 401


def test_unknown_position_is_rejected(client, hr_headers):
    res = client.post("/api/invite", json={**INVITE, "job_position_id": "astronaut"}, headers=hr_headers)
    assert res.status_code == 404
    assert res.json()["code"] == "err_job_position"


def test_employee_registers_once_and_logs_in(client, hr_headers, smtp):
    token = client.post("/api/invite", json=INVITE, headers=hr_headers).json()["token"]
    email = f"{uuid4().hex[:8]}@fourangrybirds.vn"

    public = client.get(f"/api/invite/{token}")
    assert public.status_code == 200
    assert "token" not in public.json()

    res = client.post(f"/api/invite/{token}/register", json=_register_form(email.upper(), location="Đà Nẵng"))
    assert res.status_code == 201
    assert res.json() == {"email": email, "name": "Minh Anh"}

    login = client.post("/api/auth/login", json={"email": email, "password": "Welcome#2026"})
    assert login.status_code == 200
    user = login.json()["user"]
    assert user["user_role"] == "employee"
    assert user["job_position_id"] == "cs-exec"
    assert user["department_code"] == "Customer Support"
    assert user["location"] == "Đà Nẵng"

    welcome = _body(smtp.sent[-1])
    assert email in welcome
    assert "Welcome#2026" not in welcome

    assert client.get(f"/api/invite/{token}").status_code == 410
    again = client.post(f"/api/invite/{token}/register", json=_register_form("other@fourangrybirds.vn"))
    assert again.status_code == 410
    assert again.json()["code"] == "err_invite_expired"

    listed = client.get("/api/invite", headers=hr_headers).json()
    used = next(row for row in listed if row["token"] == token)
    assert used["is_valid"] is False and used["used_at"] is not None


def test_existing_email_cannot_register(client, hr_headers):
    token = client.post("/api/invite", json=INVITE, headers=hr_headers).json()["token"]
    res = client.post(f"/api/invite/{token}/register", json=_register_form("alex.morgan@fourangrybirds.vn"))

    assert res.status_code == 409
    assert res.json()["code"] == "err_email_taken"
    assert client.get(f"/api/invite/{token}").status_code == 200


def test_password_limit_counts_bytes(client, hr_headers):
    token = client.post("/api/invite", json=INVITE, headers=hr_headers).json()["token"]
    res = client.post(f"/api/invite/{token}/register", json={**_register_form("long@fourangrybirds.vn"), "password": "ệ" * 40})
    assert res.status_code == 422


def test_revoked_invite_stops_working(client, hr_headers):
    token = client.post("/api/invite", json=INVITE, headers=hr_headers).json()["token"]

    assert client.delete(f"/api/invite/{token}", headers=hr_headers).status_code == 204
    assert client.get(f"/api/invite/{token}").status_code == 410
    assert client.get("/api/invite/not-a-token").status_code == 404


def test_invitation_email_escapes_names(client, hr_headers, smtp, db):
    hr = db.scalar(select(User).where(User.email == "hr@fourangrybirds.vn"))
    original = hr.name
    hr.name = "<b>Ops</b>"
    db.commit()
    try:
        res = client.post("/api/invite", json={**INVITE, "invited_email": "new@fourangrybirds.vn"}, headers=hr_headers)
    finally:
        hr.name = original
        db.commit()

    assert res.json()["email_sent"] is True
    html = smtp.sent[-1].get_body(("html",)).get_content()
    assert "&lt;b&gt;Ops&lt;/b&gt;" in html
    assert "<b>Ops</b>" not in html
    assert res.json()["register_url"] in _body(smtp.sent[-1])


def test_smtp_failure_does_not_block_the_invite(client, hr_headers, smtp):
    smtp.fail = True
    res = client.post("/api/invite", json={**INVITE, "invited_email": "new@fourangrybirds.vn"}, headers=hr_headers)

    assert res.status_code == 201
    assert res.json()["email_sent"] is False
