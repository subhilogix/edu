import firebase_admin
from firebase_admin import credentials, auth, firestore
import os

# 1. Initialize Firebase
cred = credentials.Certificate("serviceAccountKey.json")
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# 2. Define Mock Data
mock_ngos = [
    {
        "email": "contact@techforall.org",
        "password": "Password@123",
        "name": "TechForAll Foundation",
        "city": "Mumbai",
        "area": "Andheri West",
        "phone": "+91 9876543210",
        "description": "Empowering underprivileged students with digital literacy and coding skills.",
        "website": "www.techforall.org"
    },
    {
        "email": "info@ruralreads.org",
        "password": "Password@123",
        "name": "Rural Reads Initiative",
        "city": "Pune",
        "area": "Shivajinagar",
        "phone": "+91 8765432109",
        "description": "Bringing libraries and reading materials to rural village schools.",
        "website": "www.ruralreads.org"
    },
    {
        "email": "support@cityyouthlib.org",
        "password": "Password@123",
        "name": "City Youth Library",
        "city": "Delhi",
        "area": "Connaught Place",
        "phone": "+91 7654321098",
        "description": "A safe community space for urban youth to study and learn.",
        "website": "www.cityyouthlib.org"
    },
    {
        "email": "admin@womeninstem.org",
        "password": "Password@123",
        "name": "Women In Stem Trust",
        "city": "Bangalore",
        "area": "Indiranagar",
        "phone": "+91 6543210987",
        "description": "Supporting young girls in pursuing careers in Science, Technology, Engineering, and Math.",
        "website": "www.womeninstem.org"
    },
    {
        "email": "hello@greenearthedu.org",
        "password": "Password@123",
        "name": "Green Earth Educators",
        "city": "Chennai",
        "area": "Adyar",
        "phone": "+91 5432109876",
        "description": "Teaching sustainability and environmental science through books and workshops.",
        "website": "www.greenearthedu.org"
    }
]

print("-" * 60)
print(f"{'NGO Name':<30} | {'Email':<30} | {'Password'}")
print("-" * 60)

for ngo in mock_ngos:
    try:
        # Check if user exists
        try:
            user = auth.get_user_by_email(ngo["email"])
            print(f"User {ngo['email']} already exists. Updating profile...")
            uid = user.uid
        except auth.UserNotFoundError:
            # Create new user
            user = auth.create_user(
                email=ngo["email"],
                password=ngo["password"],
                display_name=ngo["name"],
                email_verified=True # Pre-verify email
            )
            uid = user.uid
            
        # Create/Update Firestore Profile
        user_data = {
            "uid": uid,
            "email": ngo["email"],
            "role": "ngo",
            "organization_name": ngo["name"],
            "display_name": ngo["name"], # For compatibility
            "city": ngo["city"],
            "area": ngo["area"],
            "phone": ngo["phone"],
            "description": ngo["description"],
            "website": ngo["website"],
            "is_verified": True, # <--- VERIFIED STATUS
            "created_at": firestore.SERVER_TIMESTAMP,
            "edu_credits": 100 # Give them some starting credits
        }
        
        # Merge ensures we don't overwrite existing fields if we just want to update verified status
        # But here we want to enforce the mock data, so we use set with merge=True
        db.collection("users").document(uid).set(user_data, merge=True)
        
        print(f"{ngo['name']:<30} | {ngo['email']:<30} | {ngo['password']}")

    except Exception as e:
        print(f"Error creating {ngo['name']}: {e}")

print("-" * 60)
print("✅ Mock NGOs seeded successfully!")
print("Use these credentials for your demo.")
