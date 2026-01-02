import asyncio
import sys
import os

sys.path.append(os.getcwd())
from app.db.firestore import db

async def list_ngos():
    print("NGO_LIST_START")
    docs = db.collection("users").where("role", "==", "ngo").stream()
    for doc in docs:
        ngo = doc.to_dict()
        print(f"Name: {ngo.get('organization_name')} | Loc: {ngo.get('area')}, {ngo.get('city')}")
    print("NGO_LIST_END")

if __name__ == "__main__":
    asyncio.run(list_ngos())
