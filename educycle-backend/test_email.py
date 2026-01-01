import asyncio
import os
import sys

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.core.config import settings
from app.services.email_service import send_otp_email

async def test():
    print("Checking SMTP Configuration...")
    print(f"Project Name: {settings.PROJECT_NAME}")
    print(f"SMTP_HOST: {settings.SMTP_HOST}")
    print(f"SMTP_PORT: {settings.SMTP_PORT}")
    print(f"SMTP_USER: '{settings.SMTP_USER}' (length: {len(settings.SMTP_USER)})")
    print(f"SMTP_PASSWORD: {'SET' if settings.SMTP_PASSWORD else 'NOT SET'}")
    print(f"EMAILS_FROM_EMAIL: '{settings.EMAILS_FROM_EMAIL}'")
    
    # Debug: Print where it's looking for .env
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    print(f"Looking for .env at: {env_path}")
    print(f"File exists: {os.path.exists(env_path)}")
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("❌ Error: SMTP_USER or SMTP_PASSWORD is not set in .env")
        return

    test_email = settings.EMAILS_FROM_EMAIL  # Send to yourself
    print(f"\nAttempting to send a test OTP to: {test_email}...")
    
    try:
        success = await send_otp_email(test_email)
        if success:
            print("\n✅ Test email trigger successful!")
            print("Check your terminal logs above to see if there were any SMTP errors.")
            print("Also check your inbox (and spam folder) for the EduCycle verification code.")
    except Exception as e:
        print(f"\n❌ Unexpected error during test: {e}")

if __name__ == "__main__":
    asyncio.run(test())
