from datetime import datetime
from backend.agents.news_agent import NewsAgent
from backend.agents.weather_agent import WeatherAgent
from backend.agents.port_agent import PortAgent
from backend.agents.ml_agent import MLCorrelationAgent
from backend.agents.aggregation_agent import AggregationAgent
from backend.agents.explanation_agent import ExplanationAgent
from backend.models.schemas import SystemState, MLAnalysisOutput
from backend.state import state_store
from backend.config import get_settings
from backend.services.data_logger import log_analysis_run


class Orchestrator:
    """Central orchestrator that coordinates all risk assessment agents."""

    def __init__(self):
        self.settings = get_settings()
        self.news_agent = NewsAgent()
        self.weather_agent = WeatherAgent()
        self.port_agent = PortAgent()
        self.ml_agent = MLCorrelationAgent()
        self.aggregation_agent = AggregationAgent()
        self.explanation_agent = ExplanationAgent()

    def _validate_region(self, region: str) -> bool:
        """Check if region is valid."""
        return region in self.settings.regions

    async def analyze(self, region: str) -> SystemState:
        """
        Run full risk analysis pipeline for a region.

        Execution order:
        1. News Risk Agent
        2. Weather Risk Agent
        3. Port Risk Agent
        4. ML Correlation Agent (cross-factor analysis)
        5. Risk Aggregation Agent
        6. Explanation Agent (LLM with ML insights)

        Args:
            region: Region to analyze (e.g., "Shanghai")

        Returns:
            Complete SystemState with all agent outputs
        """
        # Initialize state
        state = SystemState(
            region=region,
            timestamp=datetime.utcnow(),
            status="processing",
        )

        # Validate region
        if not self._validate_region(region):
            state.status = "error"
            state.error_message = f"Unknown region: {region}. Valid regions: {list(self.settings.regions.keys())}"
            state_store.update(state)
            return state

        try:
            # Step 1: News Risk Agent
            news_result = await self.news_agent.run(region)
            state.news_risk = news_result

            # Step 2: Weather Risk Agent
            weather_result = await self.weather_agent.run(region)
            state.weather_risk = weather_result

            # Step 3: Port Risk Agent
            port_result = await self.port_agent.run(region)
            state.port_risk = port_result

            # Step 4: ML Correlation Agent
            ml_result = await self.ml_agent.run(
                region=region,
                news_risk=news_result,
                weather_risk=weather_result,
                port_risk=port_result,
            )
            if ml_result:
                state.ml_analysis = MLAnalysisOutput(**ml_result)

            # Step 5: Risk Aggregation Agent
            aggregation_result = await self.aggregation_agent.run(
                region=region,
                news_severity=news_result.severity,
                weather_severity=weather_result.severity,
                port_severity=port_result.severity,
                ml_risk_score=ml_result.get("ml_risk_score") if ml_result else None,
            )
            state.aggregated_risk = aggregation_result

            # Step 6: Explanation Agent (now with ML insights)
            explanation = await self.explanation_agent.run(
                region=region,
                news_risk=news_result,
                weather_risk=weather_result,
                port_risk=port_result,
                aggregated_risk=aggregation_result,
                ml_analysis=ml_result,
            )
            state.explanation = explanation

            # Mark as completed
            state.status = "completed"

            # Log this real analysis run for ML training data
            log_analysis_run(
                region=region,
                news_risk=news_result,
                weather_risk=weather_result,
                port_risk=port_result,
                aggregated_risk=aggregation_result,
            )

        except Exception as e:
            state.status = "error"
            state.error_message = str(e)

        # Update global state
        state_store.update(state)

        return state

    def get_available_regions(self) -> list[str]:
        """Get list of available regions for analysis."""
        return list(self.settings.regions.keys())

