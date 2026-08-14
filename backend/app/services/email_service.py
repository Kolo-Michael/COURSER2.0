"""Email service for sending password reset codes and other notifications."""

from __future__ import annotations

import os  # APP_ENV + SMTP creds are read straight from env
import random  # generate_reset_code
import smtplib  # production SMTP transport
from email.mime.text import MIMEText  # HTML email body
from email.mime.multipart import MIMEMultipart  # multipart/alternative message
from typing import Optional

from app.core.config import settings


def generate_reset_code() -> str:
    """Generate a 6-digit numeric code."""
    return f"{random.randint(100000, 999999)}"


async def send_password_reset_email(email: str, code: str) -> bool:
    """
    Send a password reset code via email.
    
    In development, prints to console instead of sending.
    In production, uses SMTP settings from environment.
    """
    subject = "COURSER Password Reset Code"
    body = f"""
    <html>
      <body>
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your COURSER account.</p>
        <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">{code}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">COURSER Team</p>
      </body>
    </html>
    """

    # Development mode - print to console
    if os.getenv("APP_ENV", "production") == "development":
        print(f"\n{'='*50}")
        print(f"PASSWORD RESET EMAIL (dev mode)")
        print(f"To: {email}")
        print(f"Code: {code}")
        print(f"{'='*50}\n")
        return True

    # Production mode - send via SMTP
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", "noreply@courser.app")

    # Missing any SMTP credential ⇒ cannot send; fail soft so the reset
    # flow still returns success to the client (no user enumeration).
    if not all([smtp_host, smtp_user, smtp_password]):
        print("WARNING: SMTP settings not configured, email not sent")
        return False

    try:
        # Build a multipart HTML message and send over STARTTLS.
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = email
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()  # upgrade to TLS before authenticating
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


async def send_verification_email(email: str, code: str) -> bool:
    """Send an email verification code (same dev/prod split as above)."""
    subject = "COURSER Email Verification"
    body = f"""
    <html>
      <body>
        <h2>Verify Your Email</h2>
        <p>Welcome to COURSER! Please verify your email address.</p>
        <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">{code}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">COURSER Team</p>
      </body>
    </html>
    """

    if os.getenv("APP_ENV", "production") == "development":
        print(f"\n{'='*50}")
        print(f"EMAIL VERIFICATION (dev mode)")
        print(f"To: {email}")
        print(f"Code: {code}")
        print(f"{'='*50}\n")
        return True

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", "noreply@courser.app")

    if not all([smtp_host, smtp_user, smtp_password]):
        print("WARNING: SMTP settings not configured, email not sent")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = email
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False