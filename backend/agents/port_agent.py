from typing import Optional
from backend.agents.base import BaseAgent
from backend.models.schemas import PortRiskOutput
from backend.config import get_settings
from backend.services.ais_service import AISStreamService


class PortAgent(BaseAgent):
    """Agent for assessing port congestion risks using real-time AIS data."""

    def __init__(self):
        super().__init__(name="Port Risk Agent")
        self.settings = get_settings()
        self.ais_service = AISStreamService()

    def _calculate_severity_from_vessels(self, vessel_count: int, stationary_count: int) -> int:
        """
        Calculate severity based on vessel count and stationary vessels.

        Congestion model:
        - 0-5 vessels: Low (1)
        - 6-10 vessels: Low-Moderate (2)
        - 11-25 vessels: Moderate (3)
        - 26-50 vessels: High (4)
        - 50+ vessels: Critical (5)

        Adjust severity up if many vessels are stationary (waiting/anchored)
        """
        if vessel_count >= 50:
            base_severity = 5
        elif vessel_count >= 26:
            base_severity = 4
        elif vessel_count >= 11:
            base_severity = 3
        elif vessel_count >= 5:
            base_severity = 2
        else:
            base_severity = 1

        # Increase severity if many vessels are stationary (indicates congestion)
        if vessel_count > 0:
            stationary_ratio = stationary_count / vessel_count
            if stationary_ratio > 0.6 and base_severity < 5:
                base_severity += 1

        return min(5, base_severity)

    def _get_congestion_level(self, severity: int) -> str:
        """Map severity to congestion level."""
        if severity <= 2:
            return "low"
        elif severity == 3:
            return "moderate"
        elif severity == 4:
            return "high"
        else:
            return "critical"

    def _estimate_delay_from_congestion(self, severity: int, vessel_count: int) -> float:
        """Estimate average delay based on congestion severity and vessel count."""
        base_delays = {1: 2, 2: 8, 3: 24, 4: 60, 5: 120}
        base_delay = base_delays.get(severity, 24)

        if vessel_count > 40:
            base_delay *= 1.5
        elif vessel_count > 20:
            base_delay *= 1.2

        return float(base_delay)

    async def _get_real_port_data(self, region: str) -> Optional[dict]:
        """Get real port data from AIS Stream."""
        try:
            metrics = await self.ais_service.get_port_congestion(region)
            return metrics
        except Exception as e:
            print(f"[PortAgent] Failed to get AIS data for {region}: {str(e)}")
            return None

    async def run(self, region: str) -> dict:
        """
        Assess port congestion risk for a region using real-time AIS data.

        Args:
            region: Region to analyze

        Returns:
            dict with PortRiskOutput fields
        """
        # Get real AIS data
        ais_metrics = await self._get_real_port_data(region)

        # If AIS data unavailable, return minimal risk with clear message
        if ais_metrics is None or ais_metrics.get("error"):
            port_name = self.settings.regions.get(region, {}).get("port", region)
            return PortRiskOutput(
                congestion_level="low",
                severity=1,
                details=(
                    f"Unable to fetch live AIS data for {port_name}. "
                    f"No vessels detected in the monitoring window. "
                    f"This may be due to API connectivity or low AIS coverage in this area."
                ),
                vessel_queue=0,
                avg_delay_hours=0,
            )

        # Process real AIS data
        vessel_count = ais_metrics.get("vessel_count", 0)
        stationary_count = ais_metrics.get("stationary_count", 0)
        avg_speed = ais_metrics.get("avg_speed", 0)
        moored_count = ais_metrics.get("moored_count", 0)

        # Calculate severity and congestion
        severity = self._calculate_severity_from_vessels(vessel_count, stationary_count)
        congestion_level = self._get_congestion_level(severity)
        avg_delay = self._estimate_delay_from_congestion(severity, vessel_count)

        # Build detailed description
        port_name = self.settings.regions.get(region, {}).get("port", region)

        details = (
            f"{port_name} has {vessel_count} vessels detected in the area. "
            f"{stationary_count} vessels are stationary (anchored/waiting). "
            f"{moored_count} vessels are moored at berths. "
            f"Average vessel speed: {avg_speed:.1f} knots. "
        )

        if severity >= 4:
            details += "Significant congestion detected — expect major delays for incoming cargo."
        elif severity >= 3:
            details += "Moderate congestion — some delays possible for cargo operations."
        elif severity >= 2:
            details += "Light traffic — minor delays may occur."
        else:
            details += "Port operating smoothly with minimal delays."

        return PortRiskOutput(
            congestion_level=congestion_level,
            severity=severity,
            details=details,
            vessel_queue=vessel_count,
            avg_delay_hours=round(avg_delay, 1),
        )
