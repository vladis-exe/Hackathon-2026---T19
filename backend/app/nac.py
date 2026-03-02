import os
import network_as_code as nac
from network_as_code import Location
from network_as_code.models.device import DeviceIpv4Addr

apikey = os.getenv("NOKIA_API_KEY")
client = nac.NetworkAsCodeClient(
    token=apikey
)

def get_location(phone: str, max_age: int = 60) -> Location:
    my_device = client.devices.get(
        phone_number=phone
    )

    location =  my_device.location(max_age=max_age)
    return location

def reserve_capacity(phone: str, server_ipv4: str, client_ipv4: str, server_ipv6: str, port: int, duration: int):
    my_device = client.devices.get(
        ipv4_address=DeviceIpv4Addr(
            public_address=server_ipv4,
            private_address=client_ipv4,
            public_port=port
        ),
        # The phone number does not accept spaces or parentheses
        phone_number=phone
    )

    # ...and create a QoD session for the device
    my_session = my_device.create_qod_session(
        service_ipv4=server_ipv4,
        profile="DOWNLINK_L_UPLINK_L",
        # We create the session for 3600 seconds, so up to an hour
        duration=3600
    )

def remove_capacity(id: str):

    my_session = client.sessions.get(id)
    my_session.delete()