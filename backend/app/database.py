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


def initialize_db():
    """
    Seeds the database with a default camera if it's empty.
    """
    db = get_db()
    if db.count_documents({}) == 0:
        default_camera = {
            "name": "Android Drone Cam",
            "phoneNumber": "+1234567890",
            "highResolution": False,
            "streamingMode": "LOW",
            "signalingUrl": "http://10.35.218.9:8888",
            "location": {
                "latitude": 52.5200,
                "longitude": 13.4050,
                "description": "Berlin HQ"
            }
        }
        db.insert_one(default_camera)
        print("Database initialized with default camera.")
