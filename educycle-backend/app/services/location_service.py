import httpx
import math
import re
from app.db.firestore import db
from datetime import datetime

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "EduCycle/1.0"

async def verify_pickup_location(name: str, city: str):
    params = {"q": f"{name}, {city}", "format": "json", "limit": 1}
    async with httpx.AsyncClient() as client:
        res = await client.get(NOMINATIM_URL, params=params, headers={"User-Agent": USER_AGENT})
    data = res.json()
    return len(data) > 0


NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

async def geocode_address(address: str):
    """Convert an address string to lat/lon"""
    params = {"q": address, "format": "json", "limit": 1}
    async with httpx.AsyncClient() as client:
        res = await client.get(NOMINATIM_URL, params=params, headers={"User-Agent": USER_AGENT})
    
    data = res.json()
    if data:
        return float(data[0]["lat"]), float(data[0]["lon"])
    return None, None

async def reverse_geocode_coordinates(lat: float, lon: float):
    """Convert lat/lon to address details (City, Area)"""
    params = {"lat": lat, "lon": lon, "format": "json"}
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(NOMINATIM_REVERSE_URL, params=params, headers={"User-Agent": USER_AGENT})
            
        if res.status_code == 200:
            data = res.json()
            address = data.get("address", {})
            
            # Clean up city names
            city = address.get("city") or address.get("town") or address.get("village") or address.get("county") or address.get("state_district") or ""
            
            # For area, we try suburb first, but if it has "Zone", we might prefer county if suburb is just a number
            area = address.get("suburb") or address.get("neighbourhood") or address.get("road") or address.get("residential") or ""
            
            # If county is available and suburb seems like a generic zone name, use county as fallback for area
            county = address.get("county", "")
            if county and ("Zone" in area or "Ward" in area or not area):
                 # Only swap if area is messy or empty
                 if not area or "Zone" in area:
                     area = county

            # General cleaning for both city and area
            def clean_name(name):
                # Remove common Indian administrative suffixes/prefixes
                name = re.sub(r"(?i)\s+(District|Corporation|City|Municipal Corporation|Taluk)$", "", name)
                name = re.sub(r"(?i)^(Zone|Ward|Division)\s+\d+\s*", "", name)
                name = re.sub(r"(?i)^CMWSSB\s+Division\s+\d+\s*", "", name)
                # Handle cases like "Zone 3 Madhavaram" -> "Madhavaram"
                name = re.sub(r"(?i)Zone\s+\d+\s+", "", name)
                name = re.sub(r"(?i)Ward\s+\d+\s+", "", name)
                return name.strip()

            city = clean_name(city)
            area = clean_name(area)
            
            # If they ended up being the same, keep area as is but don't duplicate in full string
            display_name = f"{area}, {city}" if area and city and area.lower() != city.lower() else (area or city)

            return {
                "city": city, 
                "area": area, 
                "display_name": display_name,
                "raw_display_name": data.get("display_name") # Keep original just in case
            }
    except Exception as e:
        print(f"Reverse geocode failed: {e}")
        
    return None


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km"""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


async def find_nearby_ngos(lat: float, lon: float, radius_km: float = 10.0):
    """Find verified NGOs within radius"""
    # Note: Firestore doesn't support native geo queries easily without Geohash/external lib.
    # For MVP (small dataset), we fetch all verified NGOs and filter in memory.
    # A production app would use Geohashes.
    
    docs = db.collection("users").where("role", "==", "ngo").stream()
    
    results = []
    for doc in docs:
        ngo = doc.to_dict()
        
        # Fallback: if coordinates missing, try to geocode now (and save for later)
        if not ngo.get("coordinates"):
            city = ngo.get("city", "")
            area = ngo.get("area", "")
            if city and area:
                try:
                    q_lat, q_lon = await geocode_address(f"{area}, {city}")
                    if q_lat and q_lon:
                        ngo["coordinates"] = {"lat": q_lat, "lon": q_lon}
                        # Async update to avoid blocking too much? 
                        # For now, just fire and forget or await if critical.
                        db.collection("users").document(doc.id).update({"coordinates": ngo["coordinates"]})
                except:
                    pass
        
        if not ngo.get("coordinates"):
            continue
            
        ngo_lat = ngo["coordinates"]["lat"]
        ngo_lon = ngo["coordinates"]["lon"]
        
        dist = haversine_distance(lat, lon, ngo_lat, ngo_lon)
        
        if dist <= radius_km:
            results.append({
                "uid": doc.id,
                "name": ngo.get("organization_name", "Unknown NGO"),
                "area": ngo.get("area", ""),
                "city": ngo.get("city", ""),
                "distance_km": round(dist, 2),
                "coordinates": ngo["coordinates"]
            })
            
    # Sort by distance
    results.sort(key=lambda x: x["distance_km"])
    return results
