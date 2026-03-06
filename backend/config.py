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
        "Long Beach": {
            "lat": 33.754185,
            "lon": -118.216458,
            "port": "Port of Long Beach",
            "bbox": [[33.7, -118.3], [33.8, -118.1]],
        },
        "Singapore": {
            "lat": 1.2644,
            "lon": 103.8198,
            "port": "Port of Singapore",
            "bbox": [[1.05, 103.6], [1.45, 104.1]],
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
        # === US Ports Coverage ===
        "Savannah": {
            "lat": 32.0809,
            "lon": -81.0912,
            "port": "Port of Savannah",
            "bbox": [[32.0, -81.2], [32.2, -80.9]],
        },
        "Seattle": {
            "lat": 47.6062,
            "lon": -122.3321,
            "port": "Port of Seattle",
            "bbox": [[47.5, -122.4], [47.7, -122.3]],
        },
        # === European / Mediterranean Coverage ===
        "Southampton": {
            "lat": 50.8998,
            "lon": -1.4043,
            "port": "Port of Southampton",
            "bbox": [[50.7, -1.6], [50.9, -1.3]],
        },
        "Valencia": {
            "lat": 39.4699,
            "lon": -0.3763,
            "port": "Port of Valencia",
            "bbox": [[39.4, -0.4], [39.5, -0.2]],
        },
        "Piraeus": {
            "lat": 37.9475,
            "lon": 23.6370,
            "port": "Port of Piraeus",
            "bbox": [[37.7, 23.4], [38.1, 23.8]],
        },
        # === Canada / Middle East Coverage ===
        "Vancouver": {
            "lat": 49.2827,
            "lon": -123.1207,
            "port": "Port of Vancouver",
            "bbox": [[49.2, -123.2], [49.4, -123.0]],
        },
        "Salalah": {
            "lat": 16.9500,
            "lon": 54.0000,
            "port": "Port of Salalah",
            "bbox": [[16.7, 53.8], [17.2, 54.2]],
        },
    }

    class Config:
        env_file = ".env", "backend/.env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
