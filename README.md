## Smart Focus Streaming – Hackathon PoC

This repository contains a proof of concept for a **network-aware, AI-assisted video streaming** solution built for the Open Gateway Hackathon 2026.

The core idea is to use AI to detect important objects in a live video stream and **keep only the important regions high quality**, while degrading the rest to save bandwidth. We then combine this with **Nokia Network as Code** APIs (e.g. **Quality-of-service on Demand (QoD)** and **location / KYC APIs**) to dynamically adapt the network connectivity.

### Structure

- `backend/` – Python backend and Network as Code integration.
  - `backend/requirements.txt`
  - `backend/.env` / `backend/.env.example`
  - `backend/testing/qod_test.py`
- `front-dashboard/` – React dashboard frontend (Lovable-generated, added as a separate repo).

### Prerequisites

- Python 3.10+ (recommended).
- Access to Nokia **Network as Code**:
  - Developer account and **API key**.
  - A test **device** (SIM/eSIM) and the necessary identifiers / IPs.
  - See the official docs and examples:
    - [Network as Code developer portal](https://networkascode.nokia.io/)
    - [Python SDK – GitHub](https://github.com/nokia/network-as-code-py)

### Install backend dependencies

```bash
cd Hackathon-2026---T19/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Configure environment for QoD test

Create a `.env` file in the `backend/` folder (you can copy from `backend/.env.example`) with at least:

```bash
NAC_API_KEY=your_network_as_code_api_key
NAC_DEVICE_ID=your_device_id_or_email_like_identifier
NAC_DEVICE_PUBLIC_IP=203.0.113.10
NAC_DEVICE_PRIVATE_IP=192.0.2.10
NAC_DEVICE_PUBLIC_PORT=80
NAC_DEVICE_PHONE=+34XXXXXXXXX
NAC_QOD_SINK_URL=https://example.com/notifications
NAC_QOD_PROFILE=QOS_L
NAC_QOD_DURATION=600
NAC_SERVICE_IPV4=203.0.113.10
NAC_SERVICE_IPV6=2001:db8::10
NAC_QOD_AUTO_CLEANUP=false
```

Adjust these to match the test environment you have for the hackathon (device IDs, IPs, phone number, etc.). The values above are **examples only**.

### Run a real QoD test (backend)

With the virtual environment activated in `backend/` and `.env` configured:

```bash
cd backend
source .venv/bin/activate
python testing/qod_test.py
```

This will:

- Instantiate a `NetworkAsCodeClient` with your API key.
- Identify the device using the configured identifiers and IP information.
- Create a **QoD session** with the requested profile and duration.
- Print out session details and list all sessions for the device.
- Optionally delete the session if `NAC_QOD_AUTO_CLEANUP=true`.

This `testing/` directory is intended as a playground to validate **real Network as Code API calls** (starting with QoD). We can expand it later with scripts for **Location Retrieval**, **KYC**, and higher-level flows that integrate with the AI video pipeline.

