import random
import string
import logging
from datetime import datetime, timedelta
import aiosmtplib
from email.message import EmailMessage
from app.db.firestore import db
from app.core.config import settings

logger = logging.getLogger(__name__)

def log_debug(msg):
    print(f"OTP_DEBUG: {msg}") # Always print to logs
    try:
        with open("otp_debug.log", "a") as f:
            f.write(f"{datetime.utcnow().isoformat()} - {msg}\n")
    except Exception:
        pass # Ignore file errors in production environments

async def send_otp_email(email: str):
    """
    Generates a 6-digit OTP, saves it to Firestore, and sends it via SMTP.
    """
    otp = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Normalize email
    email = email.strip().lower()
    log_debug(f"SENDING OTP: email=[{email}], otp=[{otp}]")
    
    # Save to Firestore
    db.collection("otps").document(email).set({
        "otp": otp,
        "expires_at": expires_at,
        "created_at": datetime.utcnow()
    })
    
    # Send real email if configured
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        message = EmailMessage()
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        message["To"] = email
        message["Subject"] = f"{otp} is your EduCycle verification code"
        
        content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; rounded: 8px;">
                    <h2 style="color: #4CAF50;">Welcome to EduCycle!</h2>
                    <p>Use the following 6-digit code to verify your email address:</p>
                    <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2e7d32;">{otp}</span>
                    </div>
                    <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #888;">Giving books a second life. 🌱</p>
                </div>
            </body>
        </html>
        """
        message.add_alternative(content, subtype="html")
        
    # 1. Try Resend API (Most reliable for production, uses HTTPS Port 443)
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": f"{settings.EMAILS_FROM_NAME} <onboarding@resend.dev>", # Use their default for testing
                        "to": [email],
                        "subject": f"{otp} is your EduCycle verification code",
                        "html": content,
                    },
                    timeout=10.0
                )
                if res.status_code in [200, 201]:
                    logger.info(f"OTP email sent via RESEND API to {email}")
                    return True
                else:
                    logger.error(f"Resend API failed: {res.text}")
        except Exception as e:
            logger.error(f"Failed to send via Resend API: {e}")

    # 2. Fallback to SMTP (Often blocked in production)
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            # Port 465 uses direct TLS, Port 587 uses STARTTLS
            use_tls = settings.SMTP_PORT == 465
            start_tls = settings.SMTP_PORT == 587
            
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=use_tls,
                start_tls=start_tls,
                timeout=15.0 
            )
            logger.info(f"Real OTP email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send real email to {email}: {e}")
            print(f"⚠️ SMTP FAILED: {e}")
    
    # ALWAYS log to console for development/debug
    print(f"\n" + "="*50)
    print(f"📧 EMAIL LOG (Simulated): {email}")
    print(f"🔑 YOUR EDUCYCLE OTP: {otp}")
    print(f"⏰ EXPIRES AT: {expires_at}")
    print("="*50 + "\n")
    
    return True

async def verify_otp(email: str, otp: str, delete_on_success: bool = True):
    """
    Verifies the OTP against Firestore and checks for expiration.
    """
    # Clean email to avoid whitespace issues
    email = email.strip().lower()
    otp = otp.strip()
    log_debug(f"VERIFYING OTP: email=[{email}], otp=[{otp}]")
    
    logger.info(f"Verifying OTP for email: [{email}]")
    doc_ref = db.collection("otps").document(email)
    doc = doc_ref.get()
    
    if not doc.exists:
        log_debug(f"FAILED: doc not found for [{email}]")
        logger.warning(f"OTP document NOT FOUND for email: {email}")
        return False, "OTP not found or expired"
    
    data = doc.to_dict()
    stored_otp = str(data.get("otp"))
    expires_at = data.get("expires_at")
    
    log_debug(f"FOUND DOC: stored_otp=[{stored_otp}]")
    
    logger.info(f"Found OTP doc for {email}. Stored OTP: {stored_otp}, Input OTP: {otp}")

    # Handle timezone-aware datetimes from Firestore
    now = datetime.utcnow()
    if expires_at.tzinfo is not None:
        from datetime import timezone
        now = datetime.now(timezone.utc)
    
    # Check expiry
    if now > expires_at:
        logger.warning(f"OTP EXPIRED for {email}. Now: {now}, Expires: {expires_at}")
        doc_ref.delete()
        return False, "OTP has expired"
    
    # Check match
    if stored_otp == otp:
        log_debug(f"SUCCESS: OTP match successful for {email}")
        logger.info(f"OTP match successful for {email}")
        # Delete after successful verification if requested
        if delete_on_success:
            doc_ref.delete()
        return True, "Verification successful"
    
    log_debug(f"MISMATCH: stored=[{stored_otp}], input=[{otp}]")
    logger.warning(f"OTP MISMATCH for {email}. Stored: {stored_otp}, Input: {otp}")
    return False, "Invalid OTP"

async def delete_otp(email: str):
    email = email.strip().lower()
    db.collection("otps").document(email).delete()
    log_debug(f"DELETED OTP for [{email}]")
