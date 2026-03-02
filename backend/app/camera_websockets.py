import socketio

# Async Socket.IO server for cameras
sio_cameras = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

@sio_cameras.event
async def connect(sid, environ):
    print(f"Camera connected to WS: {sid}")

@sio_cameras.event
async def disconnect(sid):
    print(f"Camera disconnected from WS: {sid}")
