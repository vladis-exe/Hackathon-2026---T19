from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Any
import json

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
    area: Optional[List[dict]] = Field(None, description="Selected area coordinates")

class RegisterCameraRequest(BaseModel):
    phoneNumber: str = Field(..., description="Phone number for the camera's 5G connection")
    name: Optional[str] = Field(None, description="Optional friendly name for the camera")
    location: Optional[Location] = None

class Error(BaseModel):
    code: int
    message: str

class SetAreaRequest(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float

class GeminiPromptRequest(BaseModel):
    prompt: str

    @model_validator(mode='before')
    @classmethod
    def validate_to_json(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                pass
        return value
