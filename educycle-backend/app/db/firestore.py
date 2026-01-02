from app.core.firebase import get_firestore

db = get_firestore()


async def get_user_by_uid(uid: str):
    doc = db.collection("users").document(uid).get()
    if doc.exists:
        return doc.to_dict()
    return None


async def create_user_if_not_exists(uid: str, data: dict):
    ref = db.collection("users").document(uid)
    doc = ref.get()
    if not doc.exists:
        ref.set(data)
    else:
        # Update existing user, but preserve existing fields that aren't being updated
        # For NGO, always update organization_name, city, and area if provided (to fix missing data)
        update_data = {}
        for k, v in data.items():
            if v is not None:
                # Always update organization fields and display name if provided (to fix missing data)
                if k in ["organization_name", "city", "area", "display_name"]:
                    update_data[k] = v
                else:
                    # Only update other fields if they don't exist or are None
                    existing_value = doc.to_dict().get(k)
                    if existing_value is None:
                        update_data[k] = v
        
        if update_data:
            ref.update(update_data)


async def get_user_display_info(uid: str):
    user = await get_user_by_uid(uid)
    if not user:
        return {"name": "Unknown User", "location": "Unknown Location"}
    
    name = user.get("organization_name") or user.get("display_name") or user.get("email", "Anonymous")
    location = f"{user.get('area', '')}, {user.get('city', '')}".strip(", ") or "Location not specified"
    
    return {"name": name, "location": location}


async def get_blocked_uids(uid: str):
    user = await get_user_by_uid(uid)
    if not user:
        return []
    return user.get("blocked_uids", [])

