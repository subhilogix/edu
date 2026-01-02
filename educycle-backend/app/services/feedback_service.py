from datetime import datetime
from app.db.firestore import db
from firebase_admin import firestore


async def submit_feedback(from_uid: str, to_uid: str, payload: dict):
    ref = db.collection("feedback").document()

    ref.set({
        "from_uid": from_uid,
        "to_uid": to_uid,
        **payload,
        "created_at": datetime.utcnow(),
    })

    await update_reputation(to_uid)


async def update_reputation(uid: str):
    docs = db.collection("feedback").where("to_uid", "==", uid).stream()

    total_rating = 0
    count = 0
    mismatch_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        rating = data.get("rating", 5)
        
        # Penalty for condition mismatch
        if data.get("condition_matched") is False:
            rating -= 1.5 # Significant penalty for mismatch
            mismatch_count += 1
            
        total_rating += max(1, rating) # Don't go below 1
        count += 1

    if count == 0:
        return

    avg = total_rating / count

    db.collection("users").document(uid).update({
        "reputation": round(avg, 2),
        "mismatch_count": mismatch_count
    })
