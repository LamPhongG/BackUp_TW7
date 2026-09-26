"""Invitation and welcome emails over SMTP (settings `SMTP_*` in backend/.env)."""
import logging
import smtplib
from email.message import EmailMessage
from html import escape

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_STYLE = """
body{margin:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#1f2937}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb}
.head{padding:24px 32px;border-bottom:1px solid #e5e7eb;font-size:18px;font-weight:700}
.body{padding:24px 32px;font-size:15px;line-height:1.6}
.info{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin:16px 0}
.info p{margin:4px 0}
.btn{display:inline-block;margin:8px 0 16px;padding:12px 24px;background:#4f46e5;color:#fff!important;
     text-decoration:none;border-radius:8px;font-weight:600}
.foot{padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280}
"""


def _page(body: str) -> str:
    return (
        f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{_STYLE}</style></head><body>'
        f'<div class="wrap"><div class="head">SkillSprint AI</div><div class="body">{body}</div>'
        '<div class="foot">Email gửi tự động từ SkillSprint AI, vui lòng không trả lời.</div></div></body></html>'
    )


def _send(to_email: str, subject: str, html: str, text: str) -> bool:
    """Returns False when the email was not sent; the caller's action still succeeds (HR can copy the link)."""
    settings = get_settings()
    if not (settings.smtp_host and settings.smtp_user and settings.smtp_password):
        logger.warning("SMTP is not configured; email to %s not sent: %s", to_email, subject)
        return False

    msg = EmailMessage()
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    except (smtplib.SMTPException, OSError):
        logger.exception("Sending email to %s failed", to_email)
        return False
    return True


def send_invitation(
    to_email: str,
    register_url: str,
    position_name: str,
    department_name: str,
    invited_by_name: str,
    expires_days: int,
) -> bool:
    html = _page(
        f"<p>Xin chào,</p>"
        f"<p><strong>{escape(invited_by_name)}</strong> mời bạn tạo tài khoản SkillSprint AI.</p>"
        f'<div class="info"><p><strong>Vị trí:</strong> {escape(position_name)}</p>'
        f"<p><strong>Phòng ban:</strong> {escape(department_name)}</p>"
        f"<p><strong>Link hết hạn sau:</strong> {expires_days} ngày</p></div>"
        f'<a class="btn" href="{escape(register_url)}">Đăng ký tài khoản</a>'
        f"<p>Hoặc mở link: {escape(register_url)}</p>"
    )
    text = (
        f"{invited_by_name} mời bạn tạo tài khoản SkillSprint AI.\n"
        f"Vị trí: {position_name}. Phòng ban: {department_name}.\n"
        f"Đăng ký tại: {register_url}\n"
        f"Link hết hạn sau {expires_days} ngày."
    )
    return _send(to_email, "Lời mời tạo tài khoản SkillSprint AI", html, text)


def send_welcome(to_email: str, name: str, login_url: str, position_name: str) -> bool:
    """Confirms the account. The password is never sent: the employee chose it and only its hash is stored."""
    html = _page(
        f"<p>Xin chào <strong>{escape(name)}</strong>,</p>"
        f"<p>Tài khoản SkillSprint AI của bạn đã được tạo.</p>"
        f'<div class="info"><p><strong>Email đăng nhập:</strong> {escape(to_email)}</p>'
        f"<p><strong>Vị trí:</strong> {escape(position_name)}</p></div>"
        f"<p>Lộ trình học sẽ hiện trong tài khoản khi lộ trình cho vị trí của bạn được phát hành.</p>"
        f'<a class="btn" href="{escape(login_url)}">Đăng nhập</a>'
    )
    text = (
        f"Xin chào {name},\n"
        f"Tài khoản SkillSprint AI của bạn đã được tạo. Email đăng nhập: {to_email}.\n"
        f"Đăng nhập: {login_url}"
    )
    return _send(to_email, "Tài khoản SkillSprint AI đã được tạo", html, text)
