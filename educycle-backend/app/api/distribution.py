from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, Body
import json
from app.api.deps import ngo_only, get_current_user
from app.services.distribution_service import distribution_service
from app.db.storage import upload_file
from app.db.firestore import get_user_display_info

router = APIRouter()

@router.get("/")
async def list_events(limit: int = 20):
    return await distribution_service.list_events(limit)

@router.post("/")
async def create_event(
    payload: str = Form(...),
    images: list[UploadFile] = File(...),
    user=Depends(ngo_only)
):
    try:
        data = json.loads(payload)
        title = data.get("title")
        description = data.get("description")
        
        if not title or not description:
            raise HTTPException(status_code=400, detail="Title and description are required")
            
        # Get NGO name
        ngo_info = await get_user_display_info(user["uid"])
        ngo_name = ngo_info.get("name", "Verified NGO")
        
        # Upload images
        image_urls = []
        for img in images:
            url = await upload_file(await img.read(), "distributions", img.content_type)
            image_urls.append(url)
            
        return await distribution_service.create_event(
            user["uid"],
            ngo_name,
            title,
            description,
            image_urls
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{event_id}/like")
async def toggle_like(event_id: str, user=Depends(get_current_user)):
    res = await distribution_service.toggle_like(event_id, user["uid"])
    if res is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return res

@router.get("/{event_id}/comments")
async def get_comments(event_id: str):
    return await distribution_service.get_comments(event_id)

@router.post("/{event_id}/comment")
async def add_comment(event_id: str, text: str = Body(..., embed=True), user=Depends(get_current_user)):
    user_info = await get_user_display_info(user["uid"])
    user_name = user_info.get("name", "User")
    
    return await distribution_service.add_comment(
        event_id,
        user["uid"],
        user_name,
        text
    )

@router.delete("/{event_id}")
async def delete_event(event_id: str, user=Depends(get_current_user)):
    res = await distribution_service.delete_event(event_id, user["uid"])
    if "error" in res:
        status_code = 404 if res["error"] == "not_found" else 403
        raise HTTPException(status_code=status_code, detail=res["message"])
    return res
