"""
Seed training data generator for the ML correlation model.

Generates ~200 synthetic but realistic training samples covering
known supply chain risk correlations. Run once to bootstrap the model.

Usage:
    python -m backend.ml.seed_training_data
"""

import json
import random
import os
from pathlib import Path


DATA_DIR = Path(__file__).parent.parent / "data"
HISTORY_FILE = DATA_DIR / "risk_history.jsonl"

# Regions with their typical profiles
REGION_PROFILES = {
    "Shanghai": {"base_vessels": 55, "base_temp": 22, "base_wind": 12},
    "Rotterdam": {"base_vessels": 35, "base_temp": 12, "base_wind": 18},
    "Los Angeles": {"base_vessels": 30, "base_temp": 20, "base_wind": 10},
    "Singapore": {"base_vessels": 60, "base_temp": 30, "base_wind": 8},
    "Busan": {"base_vessels": 40, "base_temp": 15, "base_wind": 14},
    "Dubai": {"base_vessels": 25, "base_temp": 35, "base_wind": 15},
    "Hamburg": {"base_vessels": 28, "base_temp": 10, "base_wind": 20},
    "Antwerp": {"base_vessels": 32, "base_temp": 11, "base_wind": 16},
    "Hong Kong": {"base_vessels": 45, "base_temp": 25, "base_wind": 12},
    "Chennai": {"base_vessels": 20, "base_temp": 30, "base_wind": 10},
    "Colombo": {"base_vessels": 18, "base_temp": 28, "base_wind": 9},
    "New York": {"base_vessels": 22, "base_temp": 14, "base_wind": 16},
}

NEWS_EVENT_TYPES = ["none", "strike", "conflict", "disaster", "pandemic", "policy", "weather", "infrastructure"]


def _calculate_heuristic_severity(vessel_count: int, stationary_count: int) -> int:
    """Mirror the PortAgent heuristic severity calculation."""
    if vessel_count >= 50:
        base = 5
    elif vessel_count >= 26:
        base = 4
    elif vessel_count >= 11:
        base = 3
    elif vessel_count >= 5:
        base = 2
    else:
        base = 1
    if vessel_count > 0 and (stationary_count / vessel_count) > 0.6:
        base = min(5, base + 1)
    return base


def _calculate_heuristic_delay(severity: int, vessel_count: int) -> float:
    """Mirror the PortAgent delay estimation."""
    base_delays = {1: 2, 2: 8, 3: 24, 4: 60, 5: 120}
    delay = base_delays.get(severity, 24)
    if vessel_count > 40:
        delay *= 1.5
    elif vessel_count > 20:
        delay *= 1.2
    return float(delay)


def _weather_severity(temp: float, wind: float, rain: float) -> int:
    """Mirror the WeatherAgent severity calculation."""
    severities = []
    if rain >= 80: severities.append(5)
    elif rain >= 50: severities.append(4)
    elif rain >= 30: severities.append(3)
    elif rain >= 10: severities.append(2)

    if wind >= 80: severities.append(5)
    elif wind >= 60: severities.append(4)
    elif wind >= 40: severities.append(3)
    elif wind >= 25: severities.append(2)

    if temp <= 0: severities.append(4)
    elif temp >= 40: severities.append(4)

    return max(severities) if severities else 1


def generate_samples(n: int = 200) -> list[dict]:
    """Generate n synthetic training samples."""
    samples = []
    random.seed(42)

    for i in range(n):
        region = random.choice(list(REGION_PROFILES.keys()))
        profile = REGION_PROFILES[region]

        # --- Generate weather ---
        temp = profile["base_temp"] + random.gauss(0, 8)
        wind = max(0, profile["base_wind"] + random.gauss(0, 12))
        rain = max(0, random.expovariate(0.1)) if random.random() < 0.3 else 0
        w_severity = _weather_severity(temp, wind, rain)

        # --- Generate news ---
        # Higher chance of events for busy ports
        event_prob = 0.25 + (profile["base_vessels"] / 200)
        if random.random() < event_prob:
            event_type = random.choice(NEWS_EVENT_TYPES[1:])  # exclude "none"
            n_severity = random.choices([2, 3, 4, 5], weights=[30, 35, 25, 10])[0]
        else:
            event_type = "none"
            n_severity = 1

        # --- Generate port/vessel data ---
        # Vessels are correlated with news severity (strikes/conflicts reduce throughput -> more anchored ships)
        vessel_noise = random.gauss(0, 10)
        if n_severity >= 4:
            vessel_bonus = random.uniform(10, 25)
        elif n_severity >= 3:
            vessel_bonus = random.uniform(5, 15)
        else:
            vessel_bonus = 0
        
        # Weather also affects vessels (storms -> ships wait)
        if w_severity >= 3:
            vessel_bonus += random.uniform(5, 15)

        vessel_count = max(0, int(profile["base_vessels"] + vessel_noise + vessel_bonus))
        
        # Stationary count correlated with total vessels and bad conditions
        stationary_ratio = 0.1 + (n_severity * 0.05) + (w_severity * 0.03) + random.gauss(0, 0.08)
        stationary_ratio = max(0, min(0.8, stationary_ratio))
        stationary_count = int(vessel_count * stationary_ratio)
        
        moored_ratio = 0.15 + random.gauss(0, 0.08)
        moored_ratio = max(0, min(0.5, moored_ratio))
        moored_count = int(vessel_count * moored_ratio)

        avg_speed = max(0, 5.0 - (vessel_count * 0.03) - (w_severity * 0.3) + random.gauss(0, 0.8))

        # --- Compute heuristic outputs ---
        p_severity = _calculate_heuristic_severity(vessel_count, stationary_count)
        
        # To ensure the ML model learns that Port, Vessel, and News are the primary drivers
        # we calculate a synthetic ground-truth delay based almost entirely on these three factors.
        # We give Severity scores 4th-power scaling so they mathematically dominate the higher-variance vessel count.
        delay_from_port = (p_severity ** 4) * 1.0
        delay_from_vessels = vessel_count * 0.2
        delay_from_news = ((n_severity) ** 4) * 0.8
        
        # Calculate realistic combined delay with some noise
        delay = delay_from_port + delay_from_vessels + delay_from_news
        delay += (w_severity - 1) * 2.0
        delay += max(0, 8.0 - avg_speed)
        delay += random.uniform(0, 5.0)

        heuristic_risk = round(0.4 * n_severity + 0.3 * w_severity + 0.3 * p_severity, 1)
        heuristic_risk = max(1.0, min(5.0, heuristic_risk))

        if heuristic_risk < 2.5:
            risk_level = "Low"
        elif heuristic_risk < 3.5:
            risk_level = "Medium"
        else:
            risk_level = "High"

        samples.append({
            "timestamp": f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}T{random.randint(0,23):02d}:00:00",
            "region": region,
            "news_severity": n_severity,
            "news_event_type": event_type,
            "weather_severity": w_severity,
            "temperature_c": round(temp, 1),
            "wind_speed_kmh": round(wind, 1),
            "rainfall_mm": round(rain, 1),
            "port_severity": p_severity,
            "vessel_count": vessel_count,
            "stationary_count": stationary_count,
            "moored_count": moored_count,
            "avg_speed": round(avg_speed, 1),
            "avg_delay_hours": round(delay, 1),
            "congestion_level": "low" if p_severity <= 2 else ("moderate" if p_severity == 3 else ("high" if p_severity == 4 else "critical")),
            "heuristic_risk_score": heuristic_risk,
            "heuristic_risk_level": risk_level,
        })

    return samples


def main():
    """Generate seed data and write to JSONL file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    samples = generate_samples(200)
    
    with open(HISTORY_FILE, "w") as f:
        for s in samples:
            f.write(json.dumps(s) + "\n")
    
    print(f"Generated {len(samples)} training samples → {HISTORY_FILE}")
    
    # Print summary stats
    scores = [s["heuristic_risk_score"] for s in samples]
    print(f"  Risk score range: {min(scores):.1f} – {max(scores):.1f}")
    print(f"  Mean risk score: {sum(scores)/len(scores):.2f}")
    levels = {}
    for s in samples:
        levels[s["heuristic_risk_level"]] = levels.get(s["heuristic_risk_level"], 0) + 1
    print(f"  Level distribution: {levels}")


if __name__ == "__main__":
    main()
