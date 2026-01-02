import httpx
import asyncio

async def test_api():
    base_url = "http://localhost:8000/location/pickup-points"
    params = {
        "city": "Mumbai",
        "area": "Bandra",
        "radius": 50.0  # Large radius to ensure we find something
    }
    
    print(f"Testing API: {base_url} with params {params}")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(base_url, params=params, timeout=10.0)
            
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("User Location:", data.get("user_location"))
            print("Pickup Points Found:", len(data.get("pickup_points", [])))
            for p in data.get("pickup_points", []):
                print(f" - {p['name']} ({p['distance_km']} km)")
        else:
            print("Error:", resp.text)
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
