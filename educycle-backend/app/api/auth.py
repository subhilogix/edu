from fastapi import APIRouter, Depends
from app.services.auth_service import bootstrap_user
from app.core.security import verify_firebase_token
from app.db.firestore import get_user_by_uid
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class BootstrapRequest(BaseModel):
    role: str = "student"
    metadata: Optional[dict] = None

class SendOtpRequest(BaseModel):
    email: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class RegisterOtpRequest(BaseModel):
    email: str
    otp: str
    password: str
    role: str = "student"
    metadata: Optional[dict] = None

class LoginOtpRequest(BaseModel):
    email: str
    otp: str


@router.post("/bootstrap")
async def bootstrap(
    request: BootstrapRequest,
    token=Depends(verify_firebase_token),
):
    extra = {}
    if request.metadata:
        # Extract metadata fields
        if request.metadata.get("organization_name"):
            extra["organization_name"] = request.metadata.get("organization_name")
        if request.metadata.get("fullName"):
            extra["display_name"] = request.metadata.get("fullName")
        if request.metadata.get("city"):
            extra["city"] = request.metadata.get("city")
        if request.metadata.get("area"):
            extra["area"] = request.metadata.get("area")
    
    # Use display_name from metadata if provided, else use from token
    final_display_name = extra.get("display_name") or token.get("name")
    
    await bootstrap_user(
        uid=token["uid"],
        email=token["email"],
        role=request.role,
        display_name=final_display_name,
        extra=extra if extra else None,
    )
    return {"status": "ok"}

@router.post("/otp/send")
async def send_otp(request: SendOtpRequest):
    from app.services.email_service import send_otp_email
    await send_otp_email(request.email)
    return {"status": "ok", "message": "OTP sent"}

@router.post("/otp/register")
async def register_with_otp(request: RegisterOtpRequest):
    from app.services.email_service import verify_otp, delete_otp
    from firebase_admin import auth as firebase_auth
    
    # Don't delete immediately so if registration fails (e.g. weak password), OTP stays valid
    success, message = await verify_otp(request.email, request.otp, delete_on_success=False)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=message)
    
    # Create user in Firebase
    try:
        user_record = firebase_auth.create_user(
            email=request.email,
            password=request.password
        )
        uid = user_record.uid
        
        # Bootstrap
        extra = request.metadata or {}
        await bootstrap_user(
            uid=uid,
            email=request.email,
            role=request.role,
            display_name=extra.get("fullName") or extra.get("organization_name"),
            extra=extra
        )
        
        # SUCCESS! Delete OTP now
        await delete_otp(request.email)
        
        # Create custom token
        custom_token = firebase_auth.create_custom_token(uid)
        # Handle bytes vs str
        if isinstance(custom_token, bytes):
            custom_token = custom_token.decode("utf-8")
        
        return {"status": "ok", "uid": uid, "custom_token": custom_token}
        
    except Exception as e:
        # If user already exists, maybe they tried to register instead of login?
        error_msg = str(e)
        if "EMAIL_EXISTS" in error_msg:
            error_msg = "An account with this email already exists. Please sign in instead."
            
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=error_msg)

@router.post("/otp/login")
async def login_with_otp(request: LoginOtpRequest):
    from app.services.email_service import verify_otp, delete_otp
    from firebase_admin import auth as firebase_auth
    
    # Verify but don't delete yet
    success, message = await verify_otp(request.email, request.otp, delete_on_success=False)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=message)
    
    try:
        user = firebase_auth.get_user_by_email(request.email)
        
        # SUCCESS! Delete OTP
        await delete_otp(request.email)
        
        custom_token = firebase_auth.create_custom_token(user.uid)
        if isinstance(custom_token, bytes):
            custom_token = custom_token.decode("utf-8")
            
        return {"status": "ok", "custom_token": custom_token}
    except Exception as e:
        from fastapi import HTTPException
        if "no user record found" in str(e).lower():
            raise HTTPException(status_code=404, detail="No account found with this email. Please create an account first.")
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/me")
async def get_current_user_profile(token=Depends(verify_firebase_token)):
    """Get current user profile"""
    user = await get_user_by_uid(token["uid"])
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return user
