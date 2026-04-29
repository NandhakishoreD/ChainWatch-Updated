"""AIS Stream service for real-time vessel tracking data."""

import asyncio
import json
import aiohttp
from typing import Optional
from backend.config import get_settings

# Navigational status mapping
NAV_STATUS_MAP = {
    0: "Under Way",
    1: "At Anchor",
    2: "Not Under Command",
    3: "Restricted Maneuverability",
    4: "Constrained by Draught",
    5: "Moored",
    6: "Aground",
    7: "Engaged in Fishing",
    8: "Under Way Sailing",
    14: "AIS-SART",
    15: "Not Defined",
}

# Ship type categories
SHIP_TYPE_MAP = {
    range(20, 30): "Wing in Ground",
    range(30, 36): "Fishing/Tug/Special",
    range(36, 40): "Sailing/Pleasure",
    range(40, 50): "High Speed Craft",
    range(50, 60): "Special Craft",
    range(60, 70): "Passenger",
    range(70, 80): "Cargo",
    range(80, 90): "Tanker",
    range(90, 100): "Other",
}


def get_ship_type_name(type_code: int) -> str:
    """Map ship type code to human-readable name."""
    for type_range, name in SHIP_TYPE_MAP.items():
        if type_code in type_range:
            return name
    return "Unknown"


class AISStreamService:
    """Service for fetching real-time vessel data from AIS Stream API."""

    def __init__(self):
        self.settings = get_settings()
        self.ws_url = "wss://stream.aisstream.io/v0/stream"

    async def sample_port_vessels(
        self, 
        region: str,
        bounding_box: list[list[float]], 
        duration_seconds: int = 10
    ) -> dict:
        """
        Sample vessel data from a port area for a specified duration.
        """
        if not self.settings.aisstream_api_key:
            return {
                "vessel_count": 0,
                "avg_speed": 0,
                "stationary_count": 0,
                "moving_count": 0,
                "moored_count": 0,
                "vessels": [],
                "error": "AIS Stream API key not configured"
            }

        vessels = {}
        navigational_statuses = []
        speeds = []
        message_count = 0

        max_retries = 2
        last_error = None

        for attempt in range(max_retries):
            try:
                vessels.clear()
                navigational_statuses.clear()
                speeds.clear()
                message_count = 0

                print(f"[AIS] Attempt {attempt + 1}/{max_retries} connecting to AISStream via aiohttp...")
                conn_timeout = aiohttp.ClientTimeout(total=None, connect=10, sock_connect=10)
                async with aiohttp.ClientSession(timeout=conn_timeout) as session:
                    async with session.ws_connect(self.ws_url, heartbeat=30.0) as websocket:
                        subscribe_message = {
                            "APIKey": self.settings.aisstream_api_key,
                            "BoundingBoxes": [bounding_box],
                            "FilterMessageTypes": ["PositionReport", "ShipStaticData"]
                        }
                        
                        await websocket.send_json(subscribe_message)
                        
                        print(f"[AIS] Connected! Sampling {duration_seconds}s for bbox {bounding_box}")

                        try:
                            async with asyncio.timeout(duration_seconds):
                                async for msg in websocket:
                                    if msg.type in (aiohttp.WSMsgType.TEXT, aiohttp.WSMsgType.BINARY):
                                        message_count += 1
                                        try:
                                            # If it's bytes, decode it; if it's string, json.loads handles it natively
                                            payload = msg.data.decode('utf-8') if isinstance(msg.data, bytes) else msg.data
                                            message = json.loads(payload)
                                        except Exception as e:
                                            print(f"[AIS] Failed to parse message: {e}")
                                            continue
                                        
                                        metadata = message.get("MetaData", {})
                                        msg_type = message.get("MessageType")
                                        
                                        if msg_type == "PositionReport":
                                            ais_msg = message.get("Message", {}).get("PositionReport", {})
                                            vessel_id = ais_msg.get("UserID")
                                            
                                            if vessel_id:
                                                existing = vessels.get(vessel_id, {})
                                                nav_status_code = ais_msg.get("NavigationalStatus", 15)
                                                vessels[vessel_id] = {
                                                    **existing,
                                                    "mmsi": vessel_id,
                                                    "name": metadata.get("ShipName", existing.get("name", "Unknown")).strip().replace("@@", "").strip() or "Unknown",
                                                    "latitude": ais_msg.get("Latitude"),
                                                    "longitude": ais_msg.get("Longitude"),
                                                    "sog": round(ais_msg.get("Sog", 0), 1),
                                                    "cog": round(ais_msg.get("Cog", 0), 1),
                                                    "true_heading": ais_msg.get("TrueHeading", 0),
                                                    "nav_status": nav_status_code,
                                                    "nav_status_text": NAV_STATUS_MAP.get(nav_status_code, "Unknown"),
                                                    "rate_of_turn": ais_msg.get("RateOfTurn", 0),
                                                }
                                                
                                                speed = ais_msg.get("Sog", 0)
                                                if speed is not None:
                                                    speeds.append(speed)
                                                
                                                if nav_status_code is not None:
                                                    navigational_statuses.append(nav_status_code)

                                        elif msg_type == "ShipStaticData":
                                            static_msg = message.get("Message", {}).get("ShipStaticData", {})
                                            vessel_id = static_msg.get("UserID")
                                            
                                            if vessel_id:
                                                existing = vessels.get(vessel_id, {})
                                                ship_type_code = static_msg.get("Type", 0)
                                                
                                                raw_name = static_msg.get("Name", "Unknown")
                                                clean_name = raw_name.strip().replace("@@", "").replace("@", "").strip() or "Unknown"
                                                
                                                raw_dest = static_msg.get("Destination", "")
                                                clean_dest = raw_dest.strip().replace("@@", "").replace("@", "").strip() or "N/A"
                                                
                                                eta_data = static_msg.get("Eta", {})
                                                eta_str = ""
                                                if eta_data and eta_data.get("Month", 0) > 0:
                                                    eta_str = f"{eta_data.get('Month', 0):02d}-{eta_data.get('Day', 0):02d} {eta_data.get('Hour', 0):02d}:{eta_data.get('Minute', 0):02d}"
                                                
                                                dimension = static_msg.get("Dimension", {})
                                                length = (dimension.get("A", 0) or 0) + (dimension.get("B", 0) or 0)
                                                width = (dimension.get("C", 0) or 0) + (dimension.get("D", 0) or 0)
                                                
                                                vessels[vessel_id] = {
                                                    **existing,
                                                    "mmsi": vessel_id,
                                                    "name": clean_name,
                                                    "call_sign": static_msg.get("CallSign", "").strip() or "N/A",
                                                    "imo_number": static_msg.get("ImoNumber", 0),
                                                    "ship_type": ship_type_code,
                                                    "ship_type_text": get_ship_type_name(ship_type_code),
                                                    "destination": clean_dest,
                                                    "eta": eta_str,
                                                    "length": length,
                                                    "width": width,
                                                    "draught": static_msg.get("MaximumStaticDraught", 0),
                                                }

                        except asyncio.TimeoutError:
                            print(f"[AIS] Sampling finished. Received {message_count} messages, found {len(vessels)} unique vessels.")
                
                # Successful connection and info retrieval
                break

            except Exception as e:
                last_error = e
                print(f"AIS Stream error on attempt {attempt + 1}: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                else:
                    return {
                        "vessel_count": 0,
                        "avg_speed": 0,
                        "stationary_count": 0,
                        "moving_count": 0,
                        "moored_count": 0,
                        "vessels": [],
                        "error": str(last_error)
                    }

        # Calculate metrics
        vessel_count = len(vessels)
        avg_speed = round(sum(speeds) / len(speeds), 2) if speeds else 0
        
        # NavigationalStatus: 0=underway, 1=at anchor, 5=moored
        stationary_count = sum(1 for s in navigational_statuses if s == 1)  # at anchor
        moving_count = sum(1 for s in navigational_statuses if s == 0)  # underway
        moored_count = sum(1 for s in navigational_statuses if s == 5)  # moored

        # Determine congestion level
        if vessel_count == 0:
            congestion = "unknown"
        elif vessel_count < 10:
            congestion = "low"
        elif vessel_count < 30:
            congestion = "moderate"
        elif vessel_count < 60:
            congestion = "high"
        else:
            congestion = "critical"

        return {
            "vessel_count": vessel_count,
            "avg_speed": avg_speed,
            "stationary_count": stationary_count,
            "moving_count": moving_count,
            "moored_count": moored_count,
            "congestion_level": congestion,
            "messages_received": message_count,
            "vessels": list(vessels.values())
        }

    async def get_port_congestion(self, region: str) -> Optional[dict]:
        """
        Get port congestion data for a specific region.
        """
        region_config = self.settings.regions.get(region)
        if not region_config or "bbox" not in region_config:
            return None

        bounding_box = region_config["bbox"]
        
        try:
            metrics = await self.sample_port_vessels(region, bounding_box, duration_seconds=30)
            return metrics
        except Exception as e:
            print(f"Error fetching port congestion for {region}: {str(e)}")
            return None
