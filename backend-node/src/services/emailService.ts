/**
 * Email service for password reset codes — mirrors backend/app/services/email_service.py.
 *
 * In development the code is printed to the console; in production the email
 * is sent over SMTP via nodemailer. Missing SMTP credentials fail soft (the
 * reset flow still returns success so email addresses can't be enumerated).
 */
import crypto from "node:crypto";
import nodemailer from "nodemailer";

import { isDev } from "../config.js";

export function generateResetCode(): string {
  // crypto.randomInt is cryptographically strong (Math.random is predictable
  // and unsuitable for security codes).
  return String(crypto.randomInt(100000, 1000000));
}

function devLog(title: string, email: string, code: string): void {
  console.log("\n" + "=".repeat(50));
  console.log(`${title} (dev mode)`);
  console.log(`To: ${email}`);
  console.log(`Code: ${code}`);
  console.log("=".repeat(50) + "\n");
}

function htmlBody(subject: string, code: string, intro: string, expiresIn = "15 minutes"): string {
  return `
    <html>
      <body>
        <h2>${subject}</h2>
        <p>${intro}</p>
        <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${code}</strong></p>
        <p>This code will expire in ${expiresIn}.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">COURSER Team</p>
      </body>
    </html>
  `;
}

async function send(
  email: string,
  code: string,
  subject: string,
  intro: string,
  devTitle: string,
  expiresIn = "15 minutes"
): Promise<boolean> {
  if (isDev()) {
    devLog(devTitle, email, code);
    return true;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.FROM_EMAIL || "noreply@courser.app";

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn("WARNING: SMTP settings not configured, email not sent");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
    });
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject,
      html: htmlBody(subject, code, intro, expiresIn),
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  return send(
    email,
    code,
    "COURSER Password Reset Code",
    "You requested a password reset for your COURSER account.",
    "PASSWORD RESET EMAIL"
  );
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  return send(
    email,
    code,
    "COURSER Email Verification Code",
    "Confirm your email address to activate your COURSER account.",
    "EMAIL VERIFICATION CODE",
    "60 minutes"
  );
}