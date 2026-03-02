from app.gemini import get_prompt
from fastapi import FastAPI, HTTPException, Path, Body
from fastapi.responses import FileResponse, HTMLResponse
from typing import List
from pathlib import Path as PathLib
from dotenv import load_dotenv
import httpx
import os
from google import genai
from google.genai.types import HttpOptions
import json

from . import database as db
from .models import Camera, RegisterCameraRequest, Error, GeminiPromptRequest, SetAreaRequest

load_dotenv()

active_categories = []

api_app = FastAPI(
    title="Dashboard Cameras API",
    version="1.0.0",
    description="API for managing cameras connected to the backend (5G-connected devices)",
)


@api_app.get("/api/")
def read_root():
    return {"message": "Welcome to the Dashboard Cameras API"}


@api_app.get("/api/dashboard/cameras", response_model=List[Camera], tags=["cameras"])
def list_cameras():
    """
    Get list of cameras
    """
    cameras = [db.to_camera_dict(camera) for camera in db.get_db().find()]
    return cameras

@api_app.get(
    "/api/dashboard/camera/{id}",
    response_model=Camera,
    tags=["cameras"],
    responses={404: {"model": Error}},
)
def get_camera_by_id(id: str = Path(..., description="Camera id (UUID or internal id)")):
    """
    Get a single camera by id
    """
    from bson import ObjectId
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid camera ID format.")

    camera = db.get_db().find_one({"_id": ObjectId(id)})
    if camera:
        return db.to_camera_dict(camera)
    raise HTTPException(status_code=404, detail="Camera not found")

@api_app.post(
    "/api/dashboard/cameras/{cameraId}/set_highres/{value}",
    response_model=Camera,
    tags=["cameras"],
    responses={400: {"model": Error}, 404: {"model": Error}},
)
async def set_high_res(cameraId: str = Path(..., description="Camera id"), value: bool = Path(..., description="true to enable high-resolution mode, false to disable")):
    """
    Set high-resolution mode for a camera
    """
    from bson import ObjectId
    if not ObjectId.is_valid(cameraId):
        raise HTTPException(status_code=400, detail="Invalid camera ID format.")

    camera = db.get_db().find_one_and_update(
        {"_id": ObjectId(cameraId)},
        {"$set": {"highResolution": value}},
        return_document=True
    )
    if camera:
        # Notify the specific camera via socket.io
        camera_dict = db.to_camera_dict(camera)
        await sio.emit("camera_set_highres", {"cameraId": cameraId, "high_res": value}, room=cameraId)
        return camera_dict
        
    raise HTTPException(status_code=404, detail="Camera not found")

@api_app.post("/api/dashboard/cameras/{cameraId}/set_area", response_model=Camera, tags=["cameras"], responses={400: {"model": Error}, 404: {"model": Error}})
async def set_camera_area(req: SetAreaRequest, cameraId: str = Path(..., description="Camera id")):
    """
    Select an area in a camera feed
    """
    from bson import ObjectId
    if not ObjectId.is_valid(cameraId):
        raise HTTPException(status_code=400, detail="Invalid camera ID format.")

    area_data = {
        "xmin": req.xmin,
        "ymin": req.ymin,
        "xmax": req.xmax,
        "ymax": req.ymax
    }

    camera = db.get_db().find_one_and_update(
        {"_id": ObjectId(cameraId)},
        {"$set": {"area": area_data}},
        return_document=True
    )

    if camera:
        # Notify the specific camera via socket.io
        # Assuming we join cameras to rooms based on their cameraId
        camera_dict = db.to_camera_dict(camera)
        await sio.emit("camera_area_updated", {"cameraId": cameraId, "area": area_data}, room=cameraId)
        return camera_dict
        
    raise HTTPException(status_code=404, detail="Camera not found")

@api_app.get("/api/dashboard/cameras/{cameraId}/area", tags=["cameras"], responses={400: {"model": Error}, 404: {"model": Error}})
def get_camera_area(cameraId: str = Path(..., description="Camera id")):
    """
    Get the selected area for a camera feed
    """
    from bson import ObjectId
    if not ObjectId.is_valid(cameraId):
        raise HTTPException(status_code=400, detail="Invalid camera ID format.")

    camera = db.get_db().find_one({"_id": ObjectId(cameraId)})
    if camera:
        return {"area": camera.get("area")}
    raise HTTPException(status_code=404, detail="Camera not found")

@api_app.get("/api/dashboard/cameras/{cameraId}/highres", tags=["cameras"], responses={400: {"model": Error}, 404: {"model": Error}})
def get_camera_highres(cameraId: str = Path(..., description="Camera id")):
    """
    Get the high-resolution setting for a camera
    """
    from bson import ObjectId
    if not ObjectId.is_valid(cameraId):
        raise HTTPException(status_code=400, detail="Invalid camera ID format.")

    camera = db.get_db().find_one({"_id": ObjectId(cameraId)})
    if camera:
        return {"highResolution": camera.get("highResolution", False)}
    raise HTTPException(status_code=404, detail="Camera not found")

@api_app.post(
    "/api/dashboard/cameras/register",
    response_model=Camera,
    status_code=201,
    tags=["cameras"],
    responses={400: {"model": Error}},
)
def register_camera(req: RegisterCameraRequest):
    """
    Register a new camera
    """
    new_camera_data = req.dict()
    new_camera_data['highResolution'] = False # Default value
    
    result = db.get_db().insert_one(new_camera_data)
    created_camera = db.get_db().find_one({"_id": result.inserted_id})
    
    return db.to_camera_dict(created_camera)


    return db.to_camera_dict(created_camera)


@api_app.post("/api/gemini/set_categories", tags=["gemini"], response_model=dict)
async def call_gemini_api(
    payload: GeminiPromptRequest = Body(..., example={"prompt": "Your question here"})
):
    global active_categories
    user_prompt = payload.prompt
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Missing 'prompt' in request body.")


    prompt = get_prompt(user_prompt)

    client = genai.Client(http_options=HttpOptions(api_version="v1"), api_key=os.environ.get("GEMINI_API_KEY"))
    
    import asyncio
    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-2.5-flash",
        contents=prompt,
    )

    text = response.text.strip()
    if text.startswith("```json"):
        text = text[7:].strip()
    elif text.startswith("```"):
        text = text[3:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    print(text)
    data = json.loads(text)
    active_categories = data["categories"]
    
    await sio.emit("categories", active_categories)
    
    return data

# Simple test video endpoint serving the bundled MP4 file so the frontend
# can render a live-like preview without a real camera connected yet.
TEST_VIDEO_PATH = PathLib(__file__).resolve().parents[1] / "testing" / "6853337-uhd_2160_4096_25fps.mp4"


@api_app.get("/api/test-video", include_in_schema=False)
def test_video():
    if not TEST_VIDEO_PATH.exists():
        raise HTTPException(status_code=404, detail="Test video not found")
    return FileResponse(str(TEST_VIDEO_PATH), media_type="video/mp4")

# Serve the repository openapi.yaml file if present
@api_app.get("/openapi.yaml", include_in_schema=False)
def serve_openapi_yaml():
    """Return the static `openapi.yaml` file placed at the project root."""
    repo_root = PathLib(__file__).resolve().parents[1]
    openapi_path = repo_root / "openapi.yaml"
    if openapi_path.exists():
        return FileResponse(str(openapi_path), media_type="application/yaml")
    raise HTTPException(status_code=404, detail="openapi.yaml not found")


# Swagger UI that loads the static `/openapi.yaml` so docs come from the repo file
@api_app.get("/api/swagger", response_class=HTMLResponse, include_in_schema=False)
def swagger_ui_html():
        html = """
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Swagger UI</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        <script>
            window.ui = SwaggerUIBundle({
                url: '/openapi.yaml',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis],
                layout: 'BaseLayout'
            })
        </script>
    </body>
</html>
"""
        return HTMLResponse(content=html, status_code=200)


# --- Socket.IO integration ---
import socketio
import asyncio

# Async Socket.IO server
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@sio.event
async def connect(sid, environ):
    # If the connecting client provides a cameraId in the query string, join them to that room
    query_string = environ.get('QUERY_STRING', '')
    query_params = dict(q.split('=') for q in query_string.split('&') if '=' in q)
    camera_id = query_params.get('cameraId')
    
    if camera_id:
        sio.enter_room(sid, camera_id)
        print(f"Socket {sid} joined room: {camera_id}")
    
    # Optionally log or perform auth here
    print(f"Socket connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"Socket disconnected: {sid}")


@sio.event
async def categories_request(sid, *args):
    await sio.emit("categories", active_categories, to=sid)


async def broadcast_cameras_periodically():
    """Background task: emit the list of cameras every second to all clients."""
    while True:
        try:
            # Use thread offloading for blocking DB calls
            cameras = await asyncio.to_thread(lambda: [db.to_camera_dict(c) for c in db.get_db().find()])
            await sio.emit("cameras", cameras)
        except Exception as e:
            # Log and continue
            print("Error broadcasting cameras:", e)
        await asyncio.sleep(1)



@api_app.on_event("startup")
async def start_background_tasks():
    # store the task so we can cancel on shutdown
    api_app.state._sio_broadcast_task = asyncio.create_task(broadcast_cameras_periodically())


@api_app.on_event("shutdown")
async def stop_background_tasks():
    task = getattr(api_app.state, "_sio_broadcast_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


# Create ASGI app that mounts Socket.IO and the FastAPI app together.
app = socketio.ASGIApp(sio, other_asgi_app=api_app)
