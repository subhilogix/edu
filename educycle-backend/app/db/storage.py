from app.core.firebase import get_storage_bucket
import uuid


async def upload_file(file_bytes: bytes, path: str, content_type: str):
    bucket = get_storage_bucket()
    filename = f"{path}/{uuid.uuid4()}"
    blob = bucket.blob(filename)

    blob.upload_from_string(file_bytes, content_type=content_type)
    blob.make_public()

    return blob.public_url
