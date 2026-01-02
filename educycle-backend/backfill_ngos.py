import asyncio
import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.db.firestore import db
from app.services.location_service import geocode_address

async def fix_ngos():
    print("Fetching NGOs...")
    docs = db.collection("users").where("role", "==", "ngo").stream()
    
    count = 0
    updated = 0
    
    for doc in docs:
        count += 1
        ngo = doc.to_dict()
        uid = doc.id
        name = ngo.get("organization_name", "Unknown")
        
        if ngo.get("coordinates"):
            print(f"✅ {name} ({uid}) already has coordinates.")
            continue
            
        city = ngo.get("city", "")
        area = ngo.get("area", "")
        
        if not city or not area:
            print(f"⚠️ {name} ({uid}) missing city/area. Skipping.")
            continue
            
        address = f"{area}, {city}"
        print(f"📍 Geocoding {name}: {address}...")
        
        try:
            lat, lon = await geocode_address(address)
            if lat and lon:
                print(f"   -> Found: {lat}, {lon}")
                db.collection("users").document(uid).update({
                    "coordinates": {
                        "lat": lat,
                        "lon": lon
                    }
                })
                updated += 1
            else:
                print(f"   ❌ Could not geocode address: {address}")
        except Exception as e:
            print(f"   ❌ Error geocoding: {e}")
            
    print(f"\nDone! Processed {count} NGOs, updated {updated}.")

if __name__ == "__main__":
    asyncio.run(fix_ngos())
