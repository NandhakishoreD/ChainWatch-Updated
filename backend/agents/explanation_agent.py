from typing import Optional
from backend.agents.base import BaseAgent
from backend.services.llm_service import LLMService


class ExplanationAgent(BaseAgent):
    """Agent for generating plain-language risk explanations."""

    def __init__(self):
        super().__init__(name="Explanation Agent")
        self.llm_service = LLMService()

    async def run(
        self,
        region: str,
        news_risk: Optional[dict] = None,
        weather_risk: Optional[dict] = None,
        port_risk: Optional[dict] = None,
        aggregated_risk: Optional[dict] = None,
        ml_analysis: Optional[dict] = None,
    ) -> str:
        """
        Generate a plain-language explanation of the risk assessment.

        Args:
            region: Region being assessed
            news_risk: Output from news agent
            weather_risk: Output from weather agent
            port_risk: Output from port agent
            aggregated_risk: Output from aggregation agent
            ml_analysis: Output from ML correlation agent

        Returns:
            Plain-language explanation string
        """
        explanation = await self.llm_service.generate_explanation(
            region=region,
            news_risk=news_risk,
            weather_risk=weather_risk,
            port_risk=port_risk,
            aggregated_risk=aggregated_risk,
            ml_analysis=ml_analysis,
        )

        return explanation
