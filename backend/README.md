# Dashboard Cameras API

This is a Python backend that implements the API for managing cameras connected to the backend (5G-connected devices).

## Prerequisites

* Docker and Docker Compose
* Python 3.8+

## Setup

1.  **Clone the repository**

2.  **Create a virtual environment and install dependencies**
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Start the MongoDB database**
    ```bash
    docker-compose up -d
    ```

4.  **Run the application**
    ```bash
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
