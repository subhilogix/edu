from datetime import datetime
from app.db.firestore import db, get_user_display_info


async def donate_book(uid: str, payload: dict, image_urls: list[str]):
    ref = db.collection("books").document()
    
    user_info = await get_user_display_info(uid)

    data = {
        **payload,
        "donor_uid": uid,
        "donor_name": user_info["name"],
        "image_urls": image_urls,
        "available": True,
        "created_at": datetime.utcnow(),
    }

    ref.set(data)
    return ref.id


async def search_books(filters: dict):
    query = db.collection("books").where("available", "==", True)

    for key, value in filters.items():
        if value:
            query = query.where(key, "==", value)

    docs = query.stream()
    results = []
    user_cache = {}

    for doc in docs:
        item = doc.to_dict()
        item["id"] = doc.id
        if "donor_name" not in item:
            uid = item["donor_uid"]
            if uid not in user_cache:
                user_cache[uid] = await get_user_display_info(uid)
            item["donor_name"] = user_cache[uid]["name"]
        results.append(item)

    return results


async def get_book(book_id: str):
    doc = db.collection("books").document(book_id).get()
    if doc.exists:
        item = {**doc.to_dict(), "id": doc.id}
        if "donor_name" not in item:
            user_info = await get_user_display_info(item["donor_uid"])
            item["donor_name"] = user_info["name"]
        return item
    return None


async def mark_book_unavailable(book_id: str):
    db.collection("books").document(book_id).update({"available": False})
