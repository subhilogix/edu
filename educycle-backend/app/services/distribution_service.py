from app.db.firestore import db
from datetime import datetime
from typing import List, Dict, Any, Optional
from google.cloud.firestore_v1 import Increment

class DistributionService:
    @staticmethod
    async def create_event(ngo_uid: str, ngo_name: str, title: str, description: str, image_urls: List[str]):
        event_data = {
            "ngo_uid": ngo_uid,
            "ngo_name": ngo_name,
            "title": title,
            "description": description,
            "image_urls": image_urls,
            "timestamp": datetime.utcnow(),
            "likes_count": 0,
            "comments_count": 0,
            "liked_by": [] # uids
        }
        
        doc_ref = db.collection("distributions").document()
        doc_ref.set(event_data)
        return {"id": doc_ref.id, **event_data}

    @staticmethod
    async def list_events(limit: int = 20):
        docs = db.collection("distributions").order_by("timestamp", direction="DESCENDING").limit(limit).stream()
        events = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            events.append(data)
        return events

    @staticmethod
    async def toggle_like(event_id: str, user_uid: str):
        doc_ref = db.collection("distributions").document(event_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        liked_by = data.get("liked_by", [])
        
        if user_uid in liked_by:
            # Unlike
            doc_ref.update({
                "liked_by": [uid for uid in liked_by if uid != user_uid],
                "likes_count": Increment(-1)
            })
            return {"liked": False}
        else:
            # Like
            doc_ref.update({
                "liked_by": liked_by + [user_uid],
                "likes_count": Increment(1)
            })
            return {"liked": True}

    @staticmethod
    async def add_comment(event_id: str, user_uid: str, user_name: str, text: str):
        comment_data = {
            "user_uid": user_uid,
            "user_name": user_name,
            "text": text,
            "timestamp": datetime.utcnow()
        }
        
        event_ref = db.collection("distributions").document(event_id)
        event_doc = event_ref.get()
        if not event_doc.exists:
            return None
            
        event_data = event_doc.to_dict()
        ngo_uid = event_data.get("ngo_uid")
        
        event_ref.collection("comments").add(comment_data)
        event_ref.update({"comments_count": Increment(1)})
        
        # Notify NGO if the commenter is not the NGO itself
        if ngo_uid and ngo_uid != user_uid:
            notification_data = {
                "user_uid": ngo_uid,
                "type": "distribution_comment",
                "title": "New Comment on your Post",
                "body": f"{user_name} commented: {text[:50]}...",
                "related_id": event_id,
                "read": False,
                "timestamp": datetime.utcnow()
            }
            db.collection("notifications").add(notification_data)
            
        return comment_data

    @staticmethod
    async def get_comments(event_id: str):
        docs = db.collection("distributions").document(event_id).collection("comments").order_by("timestamp", direction="ASCENDING").stream()
        comments = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            comments.append(data)
        return comments

    @staticmethod
    async def delete_event(event_id: str, user_uid: str):
        doc_ref = db.collection("distributions").document(event_id)
        doc = doc_ref.get()
        if not doc.exists:
            return {"error": "not_found", "message": "Event not found"}
        
        data = doc.to_dict()
        if data.get("ngo_uid") != user_uid:
            return {"error": "permission_denied", "message": "You can only delete your own posts"}
            
        doc_ref.delete()
        return {"status": "success"}

distribution_service = DistributionService()
