from fastapi import APIRouter, Depends
from app.services.auth_service import bootstrap_user
from app.core.security import verify_firebase_token

router = APIRouter()


@router.post("/bootstrap")
async def bootstrap(token=Depends(verify_firebase_token)):
    await bootstrap_user(
        uid=token["uid"],
        email=token["email"],
        role="student",  # frontend controls role selection
    )
    return {"status": "ok"}
