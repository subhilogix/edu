from app.services.email_service import send_otp_email, verify_otp
import asyncio
import os

async def test_flow():
    email = "test_auth_check@example.com"
    print(f"Testing flow for {email}...")
    
    # 1. Send OTP
    await send_otp_email(email)
    print("OTP sent (simulated).")
    
    # 2. Check Firestore manually
    from app.db.firestore import db
    doc = db.collection("otps").document(email).get()
    if doc.exists:
        data = doc.to_dict()
        otp = data["otp"]
        print(f"Found OTP in Firestore: {otp}")
        
        # 3. Verify OTP
        success, message = await verify_otp(email, otp)
        print(f"Verification result: success={success}, message={message}")
        
        # 4. Check Firestore again (should be deleted)
        doc_after = db.collection("otps").document(email).get()
        print(f"Still in Firestore? {doc_after.exists}")
    else:
        print("❌ FAILED: OTP not found in Firestore after sending.")

if __name__ == "__main__":
    asyncio.run(test_flow())
