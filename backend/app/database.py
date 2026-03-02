from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId

# Simple in-memory cache for the client
_client = None

def get_db() -> Collection:
    """
    Returns the MongoDB collection object.
    """
    global _client
    if _client is None:
        _client = MongoClient('mongodb://localhost:27017/')
    
    db = _client['dashboard_cameras']
    return db.cameras

def to_camera_dict(camera):
    camera['_id'] = str(camera['_id'])
    return camera
