import json
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.core.config import settings

_firebase_app = None


def init_firebase():
    global _firebase_app

    if not firebase_admin._apps:
        service_account = settings.FIREBASE_SERVICE_ACCOUNT
        
        # Check if it's a file path that exists
        if os.path.exists(service_account):
            cred = credentials.Certificate(service_account)
        else:
            # Try to parse as JSON string (for Render/Production env vars)
            try:
                service_account_info = json.loads(service_account)
                cred = credentials.Certificate(service_account_info)
            except json.JSONDecodeError:
                # If it's not a file and not valid JSON, maybe it's a path that doesn't exist
                # Let credentials.Certificate try to handle it or raise the original error for better debugging
                print(f"Warning: Service account path '{service_account}' not found and not valid JSON.")
                cred = credentials.Certificate(service_account)

        _firebase_app = firebase_admin.initialize_app(
            cred,
            {
                "projectId": settings.FIREBASE_PROJECT_ID,
                "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
            },
        )
    return _firebase_app


def get_firestore():
    init_firebase()
    return firestore.client()


def get_storage_bucket():
    init_firebase()
    return storage.bucket()
