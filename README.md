## Smart Focus Streaming – Hackathon PoC

This repository contains a proof of concept for a **network-aware, AI-assisted video streaming** solution built for the Open Gateway Hackathon 2026.

The core idea is to use AI to detect important objects in a live video stream and **keep only the important regions high quality**, while degrading the rest to save bandwidth. We then combine this with **Nokia Network as Code** APIs (e.g. **Quality-of-service on Demand (QoD)** and **location / KYC APIs**) to dynamically adapt the network connectivity.

### Current status

- **Python backend preference** (to be implemented).
- **Testing setup for QoD** using Nokia Network as Code Python SDK in `testing/qod_test.py`.

### Prerequisites

- Python 3.10+ (recommended).
- Access to Nokia **Network as Code**:
  - Developer account and **API key**.
  - A test **device** (SIM/eSIM) and the necessary identifiers / IPs.
  - See the official docs and examples:
    - [Network as Code developer portal](https://networkascode.nokia.io/)
    - [Python SDK – GitHub](https://github.com/nokia/network-as-code-py)

### Install dependencies

```bash
cd Hackathon-2026---T19
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Configure environment for QoD test

Create a `.env` file in the project root with at least:

```bash
NAC_API_KEY=your_network_as_code_api_key
NAC_DEVICE_ID=device@testcsp.net
NAC_DEVICE_PUBLIC_IP=233.252.0.2
NAC_DEVICE_PRIVATE_IP=192.0.2.25
NAC_DEVICE_PUBLIC_PORT=80
NAC_DEVICE_PHONE=+3672123456
NAC_QOD_SINK_URL=https://example.com/notifications
NAC_QOD_PROFILE=QOS_L
NAC_QOD_DURATION=600
NAC_SERVICE_IPV4=233.252.0.2
NAC_SERVICE_IPV6=2001:db8:1234:5678:9abc:def0:fedc:ba98
NAC_QOD_AUTO_CLEANUP=false
```

Adjust these to match the test environment you have for the hackathon (device IDs, IPs, phone number, etc.). The values above are **examples only**.

### Run a real QoD test

With the virtual environment activated and `.env` configured:

```bash
python testing/qod_test.py
```

This will:

- Instantiate a `NetworkAsCodeClient` with your API key.
- Identify the device using the configured identifiers and IP information.
- Create a **QoD session** with the requested profile and duration.
- Print out session details and list all sessions for the device.
- Optionally delete the session if `NAC_QOD_AUTO_CLEANUP=true`.

This `testing/` directory is intended as a playground to validate **real Network as Code API calls** (starting with QoD). We can expand it later with scripts for **Location Retrieval**, **KYC**, and higher-level flows that integrate with the AI video pipeline.

