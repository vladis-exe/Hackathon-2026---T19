import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
import network_as_code as nac
from network_as_code.models.device import DeviceIpv4Addr, AccessTokenCredential


def load_config() -> dict:
    """
    Load configuration for a simple QoD test from environment variables.

    You can define these in a local .env file at the project root, e.g.:

        NAC_API_KEY=...
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
    """

    load_dotenv()

    def must(name: str) -> str:
        value = os.getenv(name)
        if not value:
            raise RuntimeError(f"Missing required environment variable: {name}")
        return value

    cfg = {
        "api_key": must("NAC_API_KEY"),
        "device_id": must("NAC_DEVICE_ID"),
        "device_public_ip": must("NAC_DEVICE_PUBLIC_IP"),
        "device_private_ip": os.getenv("NAC_DEVICE_PRIVATE_IP", "192.0.2.25"),
        "device_public_port": int(os.getenv("NAC_DEVICE_PUBLIC_PORT", "80")),
        "device_phone": os.getenv("NAC_DEVICE_PHONE"),
        "sink_url": os.getenv("NAC_QOD_SINK_URL", "https://example.com/notifications"),
        "qod_profile": os.getenv("NAC_QOD_PROFILE", "QOS_L"),
        "qod_duration": int(os.getenv("NAC_QOD_DURATION", "600")),
        "service_ipv4": must("NAC_SERVICE_IPV4"),
        "service_ipv6": os.getenv("NAC_SERVICE_IPV6"),
        "auto_cleanup": os.getenv("NAC_QOD_AUTO_CLEANUP", "false").lower()
        in {"1", "true", "yes"},
    }

    return cfg


def run_qod_test() -> None:
    """
    Minimal end-to-end QoD test using Nokia Network as Code.

    This script:
      1. Creates a NetworkAsCodeClient with your API key.
      2. Identifies a device.
      3. Creates a QoD session.
      4. Prints some basic info.
      5. Optionally deletes the session.

    It is based on the official QoD example from:
    - https://github.com/nokia/network-as-code-py/blob/main/examples/qod_example.py
    - https://networkascode.nokia.io/
    """

    cfg = load_config()

    client = nac.NetworkAsCodeClient(cfg["api_key"])

    device = client.devices.get(
        cfg["device_id"],
        ipv4_address=DeviceIpv4Addr(
            public_address=cfg["device_public_ip"],
            private_address=cfg["device_private_ip"],
            public_port=cfg["device_public_port"],
        ),
        ipv6_address=cfg["service_ipv6"],
        phone_number=cfg["device_phone"],
    )

    print("Creating QoD session...")
    session = device.create_qod_session(
        service_ipv4=cfg["service_ipv4"],
        service_ipv6=cfg["service_ipv6"],
        sink=cfg["sink_url"],
        sink_credential=AccessTokenCredential(
            access_token="dummy-access-token",
            access_token_expires_utc=datetime.now(timezone.utc) + timedelta(days=1),
            access_token_type="bearer",
        ),
        profile=cfg["qod_profile"],
        duration=cfg["qod_duration"],
    )

    print(f"QoD session created with id: {session.id}")
    print(f"  profile: {session.profile}")
    print(f"  duration: {session.duration} seconds")
    print(f"  started_at: {session.started_at}")
    print(f"  expires_at: {session.expires_at}")

    print("\nAll sessions for this device:")
    print(device.sessions())

    if cfg["auto_cleanup"]:
        print("\nAuto-cleanup enabled, deleting session and clearing device sessions...")
        session.delete()
        device.clear_sessions()
        print("Sessions deleted.")
    else:
        print(
            "\nAuto-cleanup disabled. You can delete this session later via the SDK "
            "or Network as Code portal."
        )


if __name__ == "__main__":
    run_qod_test()

