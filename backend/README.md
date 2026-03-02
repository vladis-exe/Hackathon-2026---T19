# Dashboard Cameras API

This is a Python backend that implements the API for managing cameras connected to the backend (5G-connected devices).

## Run with Docker (recommended)

From the `backend/` directory:

```bash
docker compose up --build
```

This will start:

- `mongo` on `mongodb://mongo:27017/`
- `backend` on `http://localhost:3000`

The FastAPI docs will be at `http://localhost:3000/docs`.

## Run locally without Docker

1. **Create a virtual environment and install dependencies**

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Start MongoDB locally** (e.g. via Docker)

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

3. **Run the application**

```bash
export MONGO_URL=mongodb://localhost:27017/
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

The API will be available at `http://localhost:3000`. You can access the OpenAPI documentation at `http://localhost:3000/docs`.

## API Endpoints

The API provides the following endpoints:

*   `GET /dashboard/cameras`: Get a list of all cameras.
*   `GET /dashboard/camera/{id}`: Get a single camera by its ID.
*   `POST /dashboard/cameras/{cameraId}/set_highres/{value}`: Set the high-resolution mode for a camera.
*   `POST /dashboard/cameras/register`: Register a new camera.

For more details, please refer to the OpenAPI documentation at `http://localhost:3000/docs`.
