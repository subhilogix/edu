from app.db.firestore import db

print("Checking 'otps' collection...")
docs = db.collection("otps").stream()
found = False
for doc in docs:
    found = True
    print(f"ID: {doc.id}, Data: {doc.to_dict()}")

if not found:
    print("No OTP documents found.")
