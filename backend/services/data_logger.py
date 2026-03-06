"""Data logger for recording risk analysis runs to build ML training data."""

import json
import os
from datetime import datetime
from pathlib import Path


DATA_DIR = Path(__file__).parent.parent / "data"
HISTORY_FILE = DATA_DIR / "risk_history.jsonl"


def ensure_data_dir():
    """Create data directory if it doesn't exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def log_analysis_run(
    region: str,
    news_risk: dict | None,
    weather_risk: dict | None,
    port_risk: dict | None,
    aggregated_risk: dict | None,
):
    """
    Append a single analysis run to the JSONL history file.
    
    This builds up historical data used to train the ML model.
    """
    ensure_data_dir()

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "region": region,
        # News features
        "news_severity": getattr(news_risk, "severity", 1) if news_risk else 1,
        "news_event_type": getattr(news_risk, "event_type", "none") if news_risk else "none",
        # Weather features
        "weather_severity": getattr(weather_risk, "severity", 1) if weather_risk else 1,
        "temperature_c": getattr(weather_risk, "temperature_c", None) if weather_risk else None,
        "wind_speed_kmh": getattr(weather_risk, "wind_speed_kmh", None) if weather_risk else None,
        "rainfall_mm": getattr(weather_risk, "rainfall_mm", None) if weather_risk else None,
        # Port features
        "port_severity": getattr(port_risk, "severity", 1) if port_risk else 1,
        "vessel_count": getattr(port_risk, "vessel_queue", 0) if port_risk else 0,
        "avg_delay_hours": getattr(port_risk, "avg_delay_hours", 0) if port_risk else 0,
        "congestion_level": getattr(port_risk, "congestion_level", "low") if port_risk else "low",
        # Aggregated output (used as training labels)
        "heuristic_risk_score": getattr(aggregated_risk, "risk_score", 1.0) if aggregated_risk else 1.0,
        "heuristic_risk_level": getattr(aggregated_risk, "risk_level", "Low") if aggregated_risk else "Low",
    }

    try:
        with open(HISTORY_FILE, "a") as f:
            f.write(json.dumps(record) + "\n")
    except Exception as e:
        print(f"[DataLogger] Failed to write record: {e}")


def load_history() -> list[dict]:
    """Load all historical analysis records."""
    if not HISTORY_FILE.exists():
        return []
    
    records = []
    with open(HISTORY_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return records


def get_record_count() -> int:
    """Get the number of records in the history file."""
    if not HISTORY_FILE.exists():
        return 0
    with open(HISTORY_FILE, "r") as f:
        return sum(1 for line in f if line.strip())
