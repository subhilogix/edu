from app.core.config import settings
import os

print("--- SMTP SETTINGS ---")
print(f"SMTP_USER: {settings.SMTP_USER}")
print(f"EMAILS_FROM_EMAIL: {settings.EMAILS_FROM_EMAIL}")
print(f"Has Password: {bool(settings.SMTP_PASSWORD)}")
print("----------------------")

# Check if we can actually reach the SMTP server
import smtplib
try:
    print(f"Connecting to {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
    server.starttls()
    print("Connection established and STARTTLS started.")
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        print(f"Attempting login for {settings.SMTP_USER}...")
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        print("✅ Login successful!")
    else:
        print("❌ Login skipped: Missing credentials in settings.")
    server.quit()
except Exception as e:
    print(f"❌ SMTP Error: {e}")
