from backend.agents.base import BaseAgent
from backend.models.schemas import AggregatedRisk


class AggregationAgent(BaseAgent):
    """Agent for aggregating risk scores from all sources."""

    # Weights for risk aggregation
    WEIGHTS = {
        "news": 0.4,
        "weather": 0.3,
        "port": 0.3,
    }

    # Risk level thresholds
    RISK_THRESHOLDS = {
        "Low": (0, 2.5),
        "Medium": (2.5, 3.5),
        "High": (3.5, 6),
    }

    def __init__(self):
        super().__init__(name="Risk Aggregation Agent")

    def _calculate_risk_level(self, score: float) -> str:
        """Map risk score to risk level category."""
        for level, (low, high) in self.RISK_THRESHOLDS.items():
            if low <= score < high:
                return level
        return "High"  # Default for edge cases

    async def run(
        self,
        region: str,
        news_severity: int = 1,
        weather_severity: int = 1,
        port_severity: int = 1,
        ml_risk_score: float | None = None,
    ) -> dict:
        """
        Aggregate risk scores from all agents.

        Args:
            region: Region being assessed
            news_severity: Severity from news agent (1-5)
            weather_severity: Severity from weather agent (1-5)
            port_severity: Severity from port agent (1-5)
            ml_risk_score: Optional ML-predicted risk score (1.0-5.0)

        Returns:
            dict with AggregatedRisk fields
        """
        # Calculate weighted risk score (heuristic)
        heuristic_risk_score = (
            self.WEIGHTS["news"] * news_severity
            + self.WEIGHTS["weather"] * weather_severity
            + self.WEIGHTS["port"] * port_severity
        )
        heuristic_risk_score = round(heuristic_risk_score, 1)

        # If ML score is available, blend it with heuristic (70% heuristic, 30% ML)
        if ml_risk_score is not None:
            risk_score = round(0.7 * heuristic_risk_score + 0.3 * ml_risk_score, 1)
        else:
            risk_score = heuristic_risk_score

        # Clamp to valid range
        risk_score = max(1.0, min(5.0, risk_score))

        # Determine risk level
        risk_level = self._calculate_risk_level(risk_score)

        # Build breakdown for transparency
        breakdown = {
            "news": {
                "severity": news_severity,
                "weight": self.WEIGHTS["news"],
                "contribution": round(self.WEIGHTS["news"] * news_severity, 2),
            },
            "weather": {
                "severity": weather_severity,
                "weight": self.WEIGHTS["weather"],
                "contribution": round(self.WEIGHTS["weather"] * weather_severity, 2),
            },
            "port": {
                "severity": port_severity,
                "weight": self.WEIGHTS["port"],
                "contribution": round(self.WEIGHTS["port"] * port_severity, 2),
            },
        }

        # Include ML comparison if available
        if ml_risk_score is not None:
            breakdown["ml_comparison"] = {
                "heuristic_score": heuristic_risk_score,
                "ml_score": round(ml_risk_score, 2),
                "blended_score": risk_score,
                "blend_ratio": "70% heuristic / 30% ML",
            }

        return AggregatedRisk(
            risk_score=risk_score,
            risk_level=risk_level,
            breakdown=breakdown,
        )
