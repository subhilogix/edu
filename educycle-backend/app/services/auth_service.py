from app.services.location_service import geocode_address
from datetime import datetime
from app.db.firestore import create_user_if_not_exists


async def bootstrap_user(uid: str, email: str, role: str, display_name: str | None = None, extra: dict | None = None):
    data = {
        "uid": uid,
        "email": email,
        "role": role,
        "display_name": display_name,
        "edu_credits": 0,
        "created_at": datetime.utcnow(),
    }

    if extra:
        data.update(extra)
        
    # Geocode NGO address on registration
    if role == "ngo" and extra:
        city = extra.get("city", "")
        area = extra.get("area", "")
        addr_string = f"{area}, {city}"
        
        # We try to get coordinates. It's okay if it fails initially, 
        # they can update profile later (though profile update logic needs to handle this too).
        try:
            lat, lon = await geocode_address(addr_string)
            if lat and lon:
                data["coordinates"] = {"lat": lat, "lon": lon}
        except Exception as e:
            print(f"Geocoding failed for {addr_string}: {e}")

    await create_user_if_not_exists(uid, data)
