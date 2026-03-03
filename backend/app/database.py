import os

from pymongo import MongoClient
from pymongo.collection import Collection
from urllib.parse import urlparse, urlunparse

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
    # Normalize signaling URL for the Android WebRTC signaling server.
    # This prevents legacy docs (e.g. port 8080) from breaking the dashboard.
    raw = camera.get("signalingUrl")
    if isinstance(raw, str) and raw.strip():
        url_str = raw.strip()
        if "://" not in url_str:
            url_str = f"http://{url_str}"
        parsed = urlparse(url_str)
        if parsed.hostname:
            port = parsed.port
            if port is None:
                port = 8888
            elif port == 8080:
                port = 8888
            netloc = f"{parsed.hostname}:{port}"
            if parsed.username or parsed.password:
                auth = parsed.username or ""
                if parsed.password:
                    auth = f"{auth}:{parsed.password}"
                netloc = f"{auth}@{netloc}"
            camera["signalingUrl"] = urlunparse(
                (
                    parsed.scheme or "http",
                    netloc,
                    parsed.path or "",
                    parsed.params or "",
                    parsed.query or "",
                    parsed.fragment or "",
                )
            ).rstrip("/")
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
            "location": {
                "latitude": 52.5200,
                "longitude": 13.4050,
                "description": "Berlin HQ"
            }
        }
        db.insert_one(default_camera)
        print("Database initialized with default camera.")
