from datetime import datetime
from app.db.firestore import db, get_user_display_info


async def create_request(book_id: str, requester_uid: str, donor_uid: str, pickup_location: str, reason: str, quantity: int = 1):
    ref = db.collection("requests").document()
    
    requester_info = await get_user_display_info(requester_uid)
    donor_info = await get_user_display_info(donor_uid)

    ref.set({
        "book_id": book_id,
        "requester_uid": requester_uid,
        "requester_name": requester_info["name"],
        "requester_location": requester_info["location"],
        "donor_uid": donor_uid,
        "donor_name": donor_info["name"],
        "donor_location": donor_info["location"],
        "pickup_location": pickup_location,
        "reason": reason,
        "quantity": quantity,
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
        item = {**doc.to_dict(), "id": doc.id}
        if "requester_name" not in item:
            requester_info = await get_user_display_info(item["requester_uid"])
            item["requester_name"] = requester_info["name"]
            item["requester_location"] = requester_info["location"]
        if "donor_name" not in item:
            donor_info = await get_user_display_info(item["donor_uid"])
            item["donor_name"] = donor_info["name"]
            item["donor_location"] = donor_info["location"]
        return item
    return None


async def list_user_requests(uid: str):
    """Get all requests for a user (as requester or donor)"""
    # Requests where user is the requester
    requester_docs = db.collection("requests").where("requester_uid", "==", uid).stream()
    
    # Requests where user is the donor
    donor_docs = db.collection("requests").where("donor_uid", "==", uid).stream()
    
    results = {}
    user_cache = {}

    async def populate_item(doc):
        item = {**doc.to_dict(), "id": doc.id}
        uids_to_check = [("requester_uid", "requester_name", "requester_location"), 
                        ("donor_uid", "donor_name", "donor_location")]
        
        for uid_key, name_key, loc_key in uids_to_check:
            if name_key not in item:
                target_uid = item[uid_key]
                if target_uid not in user_cache:
                    user_cache[target_uid] = await get_user_display_info(target_uid)
                item[name_key] = user_cache[target_uid]["name"]
                item[loc_key] = user_cache[target_uid]["location"]
        return item
    
    for doc in requester_docs:
        results[doc.id] = await populate_item(doc)
        
    for doc in donor_docs:
        results[doc.id] = await populate_item(doc)
        
    return list(results.values())
