"""ML Correlation Agent for data-driven supply chain risk analysis."""

from typing import Optional
from backend.agents.base import BaseAgent
from backend.ml.correlation_model import get_model, train_model_if_needed


class MLCorrelationAgent(BaseAgent):
    """Agent that uses ML models for cross-factor correlation analysis."""

    def __init__(self):
        super().__init__(name="ML Correlation Agent")
        # Ensure model is loaded/trained on init
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

        Args:
            region: Region being analyzed
            news_risk: Output from news agent
            weather_risk: Output from weather agent
            port_risk: Output from port agent

        Returns:
            dict with ML analysis results, or None if model not ready
        """
        model = get_model()

        if not model.is_trained:
            print("[MLAgent] Model not trained yet, skipping ML analysis")
            return None

        # Extract features from the real agent outputs
        features = {
            "news_severity": getattr(news_risk, "severity", 1) if news_risk else 1,
            "weather_severity": getattr(weather_risk, "severity", 1) if weather_risk else 1,
            "port_severity": getattr(port_risk, "severity", 1) if port_risk else 1,
            "vessel_count": getattr(port_risk, "vessel_queue", 0) if port_risk else 0,
            "avg_speed": 0,
            "wind_speed_kmh": getattr(weather_risk, "wind_speed_kmh", 0) if weather_risk else 0,
            "rainfall_mm": getattr(weather_risk, "rainfall_mm", 0) if weather_risk else 0,
            "temperature_c": getattr(weather_risk, "temperature_c", 0) if weather_risk else 0,
            "moored_count": 0,
            "stationary_count": 0,
        }

        # Run prediction on real data
        prediction = model.predict(features)

        if prediction is None:
            return None

        return prediction
