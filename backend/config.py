from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    openai_api_key: str = ""
    news_api_key: str = ""
    openweather_api_key: str = ""
    aisstream_api_key: str = ""
    backend_url: str = "http://localhost:8000"

    # Regions with coordinates and port bounding boxes for AIS tracking
    regions: dict = {
        # === Major Congested Ports ===
        "Shanghai": {
            "lat": 31.2304,
            "lon": 121.4737,
            "port": "Shanghai Port",
            "bbox": [[30.9, 121.2], [31.5, 122.0]],
        },
        "Rotterdam": {
            "lat": 51.9225,
            "lon": 4.4792,
            "port": "Port of Rotterdam",
            "bbox": [[51.7, 4.0], [52.1, 4.8]],
        },
        "Los Angeles": {
            "lat": 33.7405,
            "lon": -118.2760,
            "port": "Port of Los Angeles",
            "bbox": [[33.5, -118.5], [33.9, -118.0]],
        },
        "Singapore": {
            "lat": 1.2644,
            "lon": 103.8198,
            "port": "Port of Singapore",
            "bbox": [[1.05, 103.6], [1.45, 104.1]],
        },
        "Busan": {
            "lat": 35.0951,
            "lon": 129.0367,
            "port": "Port of Busan",
            "bbox": [[34.9, 128.8], [35.3, 129.3]],
        },
        "Dubai": {
            "lat": 25.2697,
            "lon": 55.3094,
            "port": "Jebel Ali Port",
            "bbox": [[24.9, 55.0], [25.4, 55.5]],
        },
        "Hamburg": {
            "lat": 53.5461,
            "lon": 9.9937,
            "port": "Port of Hamburg",
            "bbox": [[53.4, 9.7], [53.7, 10.2]],
        },
        "Antwerp": {
            "lat": 51.2607,
            "lon": 4.4024,
            "port": "Port of Antwerp-Bruges",
            "bbox": [[51.1, 4.1], [51.5, 4.6]],
        },
        "Hong Kong": {
            "lat": 22.2855,
            "lon": 114.1577,
            "port": "Hong Kong Port",
            "bbox": [[22.1, 113.9], [22.5, 114.4]],
        },
        "Shenzhen": {
            "lat": 22.5015,
            "lon": 114.0545,
            "port": "Shenzhen Port",
            "bbox": [[22.3, 113.7], [22.7, 114.3]],
        },
        "Tokyo": {
            "lat": 35.6524,
            "lon": 139.7776,
            "port": "Port of Tokyo",
            "bbox": [[35.4, 139.5], [35.8, 140.0]],
        },
        "New York": {
            "lat": 40.6690,
            "lon": -74.0445,
            "port": "Port of New York & New Jersey",
            "bbox": [[40.4, -74.3], [40.8, -73.7]],
        },
        "Colombo": {
            "lat": 6.9497,
            "lon": 79.8428,
            "port": "Colombo Port",
            "bbox": [[6.7, 79.6], [7.1, 80.0]],
        },
        "Piraeus": {
            "lat": 37.9475,
            "lon": 23.6370,
            "port": "Port of Piraeus",
            "bbox": [[37.7, 23.4], [38.1, 23.8]],
        },
        # === Low Congestion / Efficient Ports ===
        "Tanjung Pelepas": {
            "lat": 1.3667,
            "lon": 103.5500,
            "port": "Port of Tanjung Pelepas",
            "bbox": [[1.2, 103.4], [1.5, 103.7]],
        },
        "Salalah": {
            "lat": 16.9500,
            "lon": 54.0000,
            "port": "Port of Salalah",
            "bbox": [[16.7, 53.8], [17.2, 54.2]],
        },
        # === Indian Ports (Tamil Nadu & Kerala) ===
        "Chennai": {
            "lat": 13.0827,
            "lon": 80.2707,
            "port": "Chennai Port (Madras)",
            "bbox": [[12.9, 80.1], [13.3, 80.5]],
        },
        "Tuticorin": {
            "lat": 8.7642,
            "lon": 78.1348,
            "port": "V.O. Chidambaranar Port (Tuticorin)",
            "bbox": [[8.5, 77.9], [9.0, 78.4]],
        },
        "Cochin": {
            "lat": 9.9312,
            "lon": 76.2673,
            "port": "Cochin Port (Kochi)",
            "bbox": [[9.7, 76.0], [10.1, 76.5]],
        },
    }

    class Config:
        env_file = ".env", "backend/.env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
