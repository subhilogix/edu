from datetime import datetime
from app.db.firestore import db


async def create_request(book_id: str, requester_uid: str, donor_uid: str):
    ref = db.collection("requests").document()

    ref.set({
        "book_id": book_id,
        "requester_uid": requester_uid,
        "donor_uid": donor_uid,
        "status": "pending",
        "created_at": datetime.utcnow(),
    })

    return ref.id


async def update_request_status(request_id: str, status: str):
    db.collection("requests").document(request_id).update({
        "status": status
    })


async def get_request(request_id: str):
    doc = db.collection("requests").document(request_id).get()
    if doc.exists:
        return {**doc.to_dict(), "id": doc.id}
    return None


async def list_user_requests(uid: str):
    """Get all requests for a user (as requester or donor)"""
    docs = db.collection("requests").where("requester_uid", "==", uid).stream()
    results = []
    for doc in docs:
        results.append({**doc.to_dict(), "id": doc.id})
    return results
