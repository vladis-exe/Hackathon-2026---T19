from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Any
import json

class Location(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


class FocusAreaOut(BaseModel):
    """Focus area as percentages (0–100) for target finding / bandwidth reduction."""

    x: float = Field(..., ge=0, le=100)
    y: float = Field(..., ge=0, le=100)
    width: float = Field(..., ge=0, le=100)
    height: float = Field(..., ge=0, le=100)


class FocusAreaRequest(BaseModel):
    """Request body to set the focus area (percentages 0–100)."""

    x: float = Field(..., ge=0, le=100)
    y: float = Field(..., ge=0, le=100)
    width: float = Field(..., ge=0, le=100)
    height: float = Field(..., ge=0, le=100)


class Camera(BaseModel):
    """Strict internal camera model used in the API docs."""

    id: str = Field(..., alias="_id", description="Unique camera id (UUID or internal id)")
    name: str
    phoneNumber: str = Field(..., description="Phone number of the camera's 5G connection")
    highResolution: bool
    webrtcStream: Optional[str] = Field(
        None, description="WebRTC stream endpoint or identifier for the camera"
    )
    location: Optional[Location] = None
    area: Optional[List[dict]] = Field(None, description="Selected area coordinates")


class CameraOut(BaseModel):
    """
    More permissive output model for the dashboard.

    - Accepts both legacy and new documents.
    - Optional phoneNumber/name so older records don't cause 500s.
    """

    id: str = Field(..., alias="_id")
    name: Optional[str] = None
    phoneNumber: Optional[str] = None
    highResolution: bool = False
    webrtcStream: Optional[str] = None
    location: Optional[Location] = None
    focusArea: Optional[FocusAreaOut] = None


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
