from pydantic import BaseModel, Field, model_validator, field_validator
from typing import Optional, List, Any
import json
from urllib.parse import urlparse, urlunparse

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
    signalingUrl: Optional[str] = Field(
        None, description="Direct IP and port for the Android signaling server (e.g. http://10.35.218.9:8888)"
    )
    streamingMode: str = Field("LOW", description="Current streaming mode: LOW, HIGH, VISION, HYBRID")
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
    signalingUrl: Optional[str] = None
    streamingMode: str = "LOW"
    location: Optional[Location] = None
    focusArea: Optional[FocusAreaOut] = None


class RegisterCameraRequest(BaseModel):
    phoneNumber: str = Field(..., description="Phone number for the camera's 5G connection")
    name: Optional[str] = Field(None, description="Optional friendly name for the camera")
    signalingUrl: Optional[str] = Field(None, description="Direct IP and port for the Android signaling server (e.g. http://10.35.218.9:8888)")
    streamingMode: Optional[str] = Field("LOW", description="Streaming mode: LOW, HIGH, VISION, HYBRID")
    location: Optional[Location] = None

    @field_validator("signalingUrl")
    @classmethod
    def normalize_signaling_url(cls, value: Optional[str]) -> Optional[str]:
        """
        Normalize signalingUrl so dashboard/web can reliably connect.

        - Ensures scheme is present (defaults to http://)
        - Defaults port to 8888 when missing
        - If a legacy :8080 URL is provided, rewrite to :8888 (WebRTC signaling server)
        """
        if value is None:
            return None
        url_str = value.strip()
        if not url_str:
            return None

        if "://" not in url_str:
            url_str = f"http://{url_str}"

        parsed = urlparse(url_str)
        if not parsed.hostname:
            return value

        scheme = parsed.scheme or "http"
        hostname = parsed.hostname
        port = parsed.port

        if port is None:
            port = 8888
        elif port == 8080:
            port = 8888

        netloc = f"{hostname}:{port}"
        if parsed.username or parsed.password:
            auth = parsed.username or ""
            if parsed.password:
                auth = f"{auth}:{parsed.password}"
            netloc = f"{auth}@{netloc}"

        normalized = urlunparse((scheme, netloc, parsed.path or "", parsed.params or "", parsed.query or "", parsed.fragment or ""))
        return normalized


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
