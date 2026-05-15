"""ML Correlation Agent for data-driven supply chain risk analysis."""

from typing import Optional
from backend.agents.base import BaseAgent
from backend.ml.correlation_model import get_model, train_model_if_needed

# Minimum real records required before the ML model will make predictions.
# Matches the MIN_TRAINING_RECORDS constant in correlation_model.py.
MIN_REAL_RECORDS = 30


class MLCorrelationAgent(BaseAgent):
    """Agent that uses ML models for cross-factor correlation analysis."""

    def __init__(self):
        super().__init__(name="ML Correlation Agent")
        # Attempt to load a previously trained model on startup.
        # Will be a no-op until 30 real runs have been logged.
        train_model_if_needed()

    async def run(
        self,
        region: str,
        news_risk: Optional[object] = None,
        weather_risk: Optional[object] = None,
        port_risk: Optional[object] = None,
    ) -> Optional[dict]:
        """
        Run ML correlation analysis on the collected risk data.

        Extracts numeric features from the three agent outputs,
        feeds them through the trained ML models, and returns
        data-driven predictions alongside correlation insights.

        Returns None if model not trained yet (cold-start state).
        """
        model = get_model()

        if not model.is_trained:
            from backend.services.data_logger import get_record_count
            real_count = get_record_count()
            print(f"[MLAgent] Model not trained yet — {real_count}/{MIN_REAL_RECORDS} real records collected.")
            # Return a structured cold-start indicator so the frontend can
            # show a meaningful message rather than silently hiding the ML section.
            return {
                "status": "insufficient_data",
                "real_records_collected": real_count,
                "required": MIN_REAL_RECORDS,
            }

        # Extract features from the real agent outputs.
        # All vessel metrics now come from the port agent's real AIS data.
        features = {
            "news_severity":    getattr(news_risk, "severity", 1) if news_risk else 1,
            "weather_severity": getattr(weather_risk, "severity", 1) if weather_risk else 1,
            "port_severity":    getattr(port_risk, "severity", 1) if port_risk else 1,
            # Real AIS vessel metrics — no longer hardcoded zeros
            "vessel_count":     getattr(port_risk, "vessel_queue", 0) if port_risk else 0,
            "avg_speed":        getattr(port_risk, "avg_speed", 0.0) if port_risk else 0.0,
            "stationary_count": getattr(port_risk, "stationary_count", 0) if port_risk else 0,
            "moored_count":     getattr(port_risk, "moored_count", 0) if port_risk else 0,
            # Weather continuous features
            "wind_speed_kmh":   getattr(weather_risk, "wind_speed_kmh", 0) if weather_risk else 0,
            "rainfall_mm":      getattr(weather_risk, "rainfall_mm", 0) if weather_risk else 0,
            "temperature_c":    getattr(weather_risk, "temperature_c", 0) if weather_risk else 0,
        }

        # Run prediction on real features
        prediction = model.predict(features)

        if prediction is None:
            return None

        # Tag the prediction with the port data source so consumers know
        # whether the vessel features are from live AIS or a fallback estimate.
        prediction["port_data_source"] = getattr(port_risk, "data_source", "unknown")

        return prediction
