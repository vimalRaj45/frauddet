import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("fraud_detector.ip_geo")

# Local cache for resolved IPs to minimize HTTP calls and maximize throughput
_IP_CACHE: Dict[str, Dict[str, Any]] = {}

# Private IP mock regions for realistic local testing
_PRIVATE_IP_SIMULATIONS = {
    "127.0.0.1": {"country": "United States", "city": "New York", "is_proxy": False, "is_hosting": False},
    "192.168.1.1": {"country": "United States", "city": "San Francisco", "is_proxy": False, "is_hosting": False},
    "185.220.101.5": {"country": "Panama", "city": "Panama City", "is_proxy": True, "is_hosting": True},
    "185.220.101.9": {"country": "Cayman Islands", "city": "George Town", "is_proxy": True, "is_hosting": True},
    "185.220.101.12": {"country": "Seychelles", "city": "Victoria", "is_proxy": True, "is_hosting": True},
    "185.220.101.44": {"country": "Nigeria", "city": "Lagos", "is_proxy": True, "is_hosting": False},
    "198.51.100.42": {"country": "United States", "city": "San Francisco", "is_proxy": False, "is_hosting": False}
}

def is_private_or_local(ip: str) -> bool:
    if not ip:
        return True
    return (
        ip.startswith("127.") or
        ip.startswith("10.") or
        ip.startswith("192.168.") or
        ip.startswith("172.16.") or
        ip in ["localhost", "::1"]
    )

def lookup_ip_geolocation(ip: str) -> Dict[str, Any]:
    """
    Resolves geographic location and proxy/datacenter indicators from an IP address.
    Uses cached memory + http://ip-api.com free endpoint.
    """
    if not ip or ip.strip() == "":
        return {
            "ip": "0.0.0.0",
            "country": "Unknown",
            "city": "Unknown",
            "is_proxy": False,
            "is_hosting": False,
            "resolved_location": "Unknown Location"
        }

    ip = ip.strip()

    # Check Memory Cache
    if ip in _IP_CACHE:
        return _IP_CACHE[ip]

    # Check simulated high-risk / private IPs
    if ip in _PRIVATE_IP_SIMULATIONS:
        sim = _PRIVATE_IP_SIMULATIONS[ip]
        res = {
            "ip": ip,
            "country": sim["country"],
            "city": sim["city"],
            "is_proxy": sim["is_proxy"],
            "is_hosting": sim["is_hosting"],
            "resolved_location": f"{sim['city']}, {sim['country']}"
        }
        _IP_CACHE[ip] = res
        return res

    # If standard private network IP
    if is_private_or_local(ip):
        res = {
            "ip": ip,
            "country": "Local / Private Network",
            "city": "Internal LAN",
            "is_proxy": False,
            "is_hosting": False,
            "resolved_location": "Local Network"
        }
        _IP_CACHE[ip] = res
        return res

    # External IP-API Lookup
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,message,country,city,isp,proxy,hosting"
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                country = data.get("country", "Unknown")
                city = data.get("city", "Unknown")
                is_proxy = bool(data.get("proxy", False))
                is_hosting = bool(data.get("hosting", False))

                result = {
                    "ip": ip,
                    "country": country,
                    "city": city,
                    "isp": data.get("isp"),
                    "is_proxy": is_proxy,
                    "is_hosting": is_hosting,
                    "resolved_location": f"{city}, {country}" if city != "Unknown" else country
                }
                _IP_CACHE[ip] = result
                return result
    except Exception as e:
        logger.debug(f"IP Geolocation query error for {ip}: {e}")

    # Default fallback
    fallback = {
        "ip": ip,
        "country": "Unknown",
        "city": "Unknown",
        "is_proxy": False,
        "is_hosting": False,
        "resolved_location": "Unknown Location"
    }
    _IP_CACHE[ip] = fallback
    return fallback
