from pydantic import BaseModel, Field
from typing import Optional, List

class Location(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

class Camera(BaseModel):
    id: str = Field(..., alias="_id", description="Unique camera id (UUID or internal id)")
    name: str
    phoneNumber: str = Field(..., description="Phone number of the camera's 5G connection")
    highResolution: bool
    webrtcStream: Optional[str] = Field(None, description="WebRTC stream endpoint or identifier for the camera")
    location: Optional[Location] = None

class RegisterCameraRequest(BaseModel):
    phoneNumber: str = Field(..., description="Phone number for the camera's 5G connection")
    name: Optional[str] = Field(None, description="Optional friendly name for the camera")
    location: Optional[Location] = None

class Error(BaseModel):
    code: int
    message: str
