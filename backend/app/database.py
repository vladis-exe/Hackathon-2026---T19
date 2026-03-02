import os

from pymongo import MongoClient
from pymongo.collection import Collection

# Simple in-memory cache for the client
_client = None


def get_db() -> Collection:
    """
    Returns the MongoDB collection object.
    """
    global _client
    if _client is None:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
        _client = MongoClient(mongo_url)

    db = _client["dashboard_cameras"]
    return db.cameras


def to_camera_dict(camera):
    camera["_id"] = str(camera["_id"])
    return camera
