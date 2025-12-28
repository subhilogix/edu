from app.core.firebase import get_firestore

db = get_firestore()


async def get_user_by_uid(uid: str):
    doc = db.collection("users").document(uid).get()
    if doc.exists:
        return doc.to_dict()
    return None


async def create_user_if_not_exists(uid: str, data: dict):
    ref = db.collection("users").document(uid)
    if not ref.get().exists:
        ref.set(data)
