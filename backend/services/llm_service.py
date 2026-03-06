import json
from openai import AsyncOpenAI
from typing import Optional
from backend.config import get_settings


class LLMService:
    """Service for LLM-powered text analysis using OpenAI."""

    def __init__(self):
        self.settings = get_settings()
        self.client = AsyncOpenAI(api_key=self.settings.openai_api_key)
        self.model = "gpt-4o-mini"

    async def classify_news_risk(self, news_articles: list[dict]) -> dict:
        """
        Classify news articles for supply chain risk.

        Args:
            news_articles: List of news articles with title and description

        Returns:
            dict with event_type, severity, and summary
        """
        if not news_articles:
            return {
                "event_type": "none",
                "severity": 1,
                "summary": "No relevant news found for this region.",
            }

        articles_text = "\n".join(
            [
                f"- {article.get('title', '')}: {article.get('description', '')}"
                for article in news_articles[:10]
            ]
        )

        prompt = f"""Analyze the following news headlines for supply chain disruption risks.

NEWS ARTICLES:
{articles_text}

Based on these articles, provide:
1. event_type: The primary type of disruption (one of: strike, conflict, disaster, pandemic, policy, weather, infrastructure, none)
2. severity: A score from 1-5 where:
   - 1: No significant risk
   - 2: Minor potential disruption
   - 3: Moderate risk, may cause delays
   - 4: High risk, likely significant disruption
   - 5: Critical, severe supply chain impact expected
3. summary: A brief 1-2 sentence summary of the key findings

Respond in JSON format:
{{"event_type": "...", "severity": N, "summary": "..."}}

If no supply chain relevant news is found, return event_type "none" with severity 1."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a supply chain risk analyst. Analyze news for disruption risks and provide structured assessments.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)
            return {
                "event_type": result.get("event_type", "none"),
                "severity": min(max(int(result.get("severity", 1)), 1), 5),
                "summary": result.get("summary", "Unable to analyze news."),
            }

        except Exception as e:
            return {
                "event_type": "none",
                "severity": 1,
                "summary": f"Error analyzing news: {str(e)}",
            }

    async def generate_explanation(
        self,
        region: str,
        news_risk: Optional[dict],
        weather_risk: Optional[dict],
        port_risk: Optional[dict],
        aggregated_risk: Optional[dict],
        ml_analysis: Optional[dict] = None,
    ) -> str:
        """
        Generate a plain-language explanation of the overall risk assessment.

        Args:
            region: Region being analyzed
            news_risk: News risk output
            weather_risk: Weather risk output
            port_risk: Port risk output
            aggregated_risk: Aggregated risk output
            ml_analysis: ML correlation analysis output

        Returns:
            Plain-language explanation string
        """
        context = f"""Region: {region}

NEWS RISK:
- Event Type: {getattr(news_risk, 'event_type', 'N/A') if news_risk else 'N/A'}
- Severity: {getattr(news_risk, 'severity', 'N/A') if news_risk else 'N/A'}/5
- Summary: {getattr(news_risk, 'summary', 'N/A') if news_risk else 'N/A'}

WEATHER RISK:
- Condition: {getattr(weather_risk, 'weather_condition', 'N/A') if weather_risk else 'N/A'}
- Severity: {getattr(weather_risk, 'severity', 'N/A') if weather_risk else 'N/A'}/5
- Details: {getattr(weather_risk, 'details', 'N/A') if weather_risk else 'N/A'}

PORT RISK:
- Congestion Level: {getattr(port_risk, 'congestion_level', 'N/A') if port_risk else 'N/A'}
- Severity: {getattr(port_risk, 'severity', 'N/A') if port_risk else 'N/A'}/5
- Details: {getattr(port_risk, 'details', 'N/A') if port_risk else 'N/A'}

OVERALL RISK:
- Risk Score: {getattr(aggregated_risk, 'risk_score', 'N/A') if aggregated_risk else 'N/A'}/5
- Risk Level: {getattr(aggregated_risk, 'risk_level', 'N/A') if aggregated_risk else 'N/A'}"""

        # Add ML insights if available
        if ml_analysis:
            ml_score = ml_analysis.get("ml_risk_score", "N/A")
            ml_delay = ml_analysis.get("ml_delay_hours", "N/A")
            ml_level = ml_analysis.get("ml_risk_level", "N/A")
            top_corr = ml_analysis.get("top_correlations", [])
            feat_imp = ml_analysis.get("feature_importances", {})
            confidence = ml_analysis.get("confidence", 0)

            context += f"""

ML CORRELATION ANALYSIS (trained on historical data, confidence: {confidence:.0%}):
- ML Risk Score: {ml_score}/5 (vs heuristic above)
- ML Predicted Delay: {ml_delay} hours
- ML Risk Level: {ml_level}"""

            if top_corr:
                context += "\n- Top Cross-Factor Correlations:"
                for c in top_corr[:3]:
                    context += f"\n  • {c['factor_1']} ↔ {c['factor_2']}: {c['correlation']:.2f} ({c['strength']})"

            if feat_imp:
                sorted_imp = sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)[:3]
                context += "\n- Top Risk Drivers (by ML feature importance):"
                for name, imp in sorted_imp:
                    context += f"\n  • {name}: {imp:.1f}%"

        prompt = f"""Based on the following supply chain risk assessment data, generate a clear, concise explanation for a business stakeholder.

{context}

Requirements:
1. Write 2-3 sentences explaining the overall risk level
2. Reference specific factors that contribute to the risk
3. Use plain language, avoid technical jargon
4. Only reference facts from the provided data - do not speculate
5. If risk is low, indicate business can proceed normally
6. If risk is high, indicate caution is advised
7. If ML analysis is available, briefly mention whether the ML model agrees or diverges from the heuristic assessment and what key correlations the model found

Provide only the explanation text, no headers or formatting."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a supply chain risk communication specialist. Provide clear, factual explanations of risk assessments.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=400,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            return f"Unable to generate explanation: {str(e)}"

    async def answer_chat_question(
        self,
        question: str,
        system_state: Optional[dict],
    ) -> str:
        """
        Answer a user question based on current system state.

        Args:
            question: User's question
            system_state: Current system state dict

        Returns:
            Answer string
        """
        if not system_state:
            return "No risk assessment data is currently available. Please run an analysis first."

        context = f"""Current System State:
Region: {system_state.get('region', 'Unknown')}
Last Updated: {system_state.get('timestamp', 'Unknown')}

News Risk:
{json.dumps(system_state.get('news_risk', {}), indent=2)}

Weather Risk:
{json.dumps(system_state.get('weather_risk', {}), indent=2)}

Port Risk:
{json.dumps(system_state.get('port_risk', {}), indent=2)}

Aggregated Risk:
{json.dumps(system_state.get('aggregated_risk', {}), indent=2)}

Explanation: {system_state.get('explanation', 'N/A')}"""

        prompt = f"""Based on the following supply chain risk assessment data, answer the user's question.

{context}

USER QUESTION: {question}

Requirements:
1. Only answer based on the provided data
2. If the question cannot be answered from available data, say so
3. Be concise and direct
4. Do not speculate or make up information"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that answers questions about supply chain risk assessments. Only use the provided data to answer questions.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=500,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            return f"Error processing your question: {str(e)}"
