import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.orchestrator import Orchestrator
from backend.state import state_store
from backend.config import get_settings
from backend.models.schemas import SystemState, ChatRequest, ChatResponse
from backend.services.llm_service import LLMService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("ChainWatch API starting up...")
    yield
    # Shutdown
    print("ChainWatch API shutting down...")


app = FastAPI(
    title="ChainWatch API",
    description="AI-Based Supply Chain Risk Monitoring System",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for Streamlit frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
orchestrator = Orchestrator()
llm_service = LLMService()
settings = get_settings()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "chainwatch-api"}


@app.get("/regions")
async def get_regions():
    """Get list of available regions for analysis."""
    return {
        "regions": orchestrator.get_available_regions(),
        "details": settings.regions,
    }


@app.post("/analyze/{region}", response_model=SystemState)
async def analyze_region(region: str):
    """
    Run full risk analysis for a region.

    Args:
        region: Region name (Shanghai, Rotterdam, Los Angeles)

    Returns:
        Complete system state with all risk assessments
    """
    if region not in settings.regions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid region: {region}. Valid options: {list(settings.regions.keys())}",
        )

    result = await orchestrator.analyze(region)

    if result.status == "error":
        raise HTTPException(status_code=500, detail=result.error_message)

    return result


@app.get("/state", response_model=SystemState | None)
async def get_current_state():
    """Get the current system state from the last analysis."""
    state = state_store.get()
    if not state:
        return None
    return state


@app.get("/state/summary")
async def get_state_summary():
    """Get a summary of the current state."""
    state = state_store.get()
    if not state:
        return {"status": "no_data", "message": "No analysis has been run yet."}

    return {
        "status": "ok",
        "region": state.region,
        "risk_level": state.aggregated_risk.get("risk_level") if state.aggregated_risk else None,
        "risk_score": state.aggregated_risk.get("risk_score") if state.aggregated_risk else None,
        "last_updated": state_store.get_last_updated(),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint for asking questions about the current risk assessment.

    Args:
        request: ChatRequest with user message

    Returns:
        AI-generated response based on current system state
    """
    state = state_store.get()

    if not state:
        return ChatResponse(
            response="No risk assessment data is available. Please run an analysis first by selecting a region.",
            based_on_data=False,
        )

    # Convert state to dict for LLM
    state_dict = state.model_dump() if state else None

    response = await llm_service.answer_chat_question(
        question=request.message,
        system_state=state_dict,
    )

    return ChatResponse(response=response, based_on_data=True)


# ============ Port Monitor Endpoints ============

from backend.services.ais_service import AISStreamService

ais_service = AISStreamService()


@app.get("/port/vessels/{region}")
async def get_port_vessels(region: str):
    """
    Get live vessel data for a port region from AISStream.io.
    Samples the AIS feed for 30 seconds and returns all detected vessels.
    """
    if region not in settings.regions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid region: {region}. Valid options: {list(settings.regions.keys())}",
        )

    region_config = settings.regions[region]
    bbox = region_config.get("bbox")
    if not bbox:
        raise HTTPException(status_code=400, detail=f"No bounding box configured for {region}")

    try:
        ais_service = AISStreamService()
        port_data = await ais_service.sample_port_vessels(
            region=region,
            bounding_box=region_config["bbox"],
            duration_seconds=45
        )
        return port_data
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vessel data: {str(e)}")


@app.get("/port/stats/{region}")
async def get_port_stats(region: str):
    """
    Get aggregated port statistics for a region.
    Quick 15-second sample for stats overview.
    """
    if region not in settings.regions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid region: {region}. Valid options: {list(settings.regions.keys())}",
        )

    region_config = settings.regions[region]
    bbox = region_config.get("bbox")
    if not bbox:
        raise HTTPException(status_code=400, detail=f"No bounding box configured for {region}")

    try:
        result = await ais_service.sample_port_vessels(region, bbox, duration_seconds=15)

        # Calculate ship type breakdown from vessels
        type_breakdown = {}
        for vessel in result.get("vessels", []):
            ship_type = vessel.get("ship_type_text", "Unknown")
            type_breakdown[ship_type] = type_breakdown.get(ship_type, 0) + 1

        return {
            "region": region,
            "port_name": region_config.get("port", region),
            "vessel_count": result["vessel_count"],
            "avg_speed": result["avg_speed"],
            "moving_count": result["moving_count"],
            "stationary_count": result["stationary_count"],
            "moored_count": result.get("moored_count", 0),
            "congestion_level": result.get("congestion_level", "unknown"),
            "ship_type_breakdown": type_breakdown,
            "messages_received": result.get("messages_received", 0),
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch port stats: {str(e)}")


@app.get("/port/risk-overview/{region}")
async def get_port_risk_overview(region: str):
    """
    Get full supply chain risk overview for a region.
    Runs the complete analysis pipeline (news + weather + port) and
    also collects live AIS vessel data for the map.
    """
    if region not in settings.regions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid region: {region}. Valid options: {list(settings.regions.keys())}",
        )

    region_config = settings.regions[region]
    bbox = region_config.get("bbox")

    try:
        import asyncio

        # Run full analysis + AIS scan concurrently
        analysis_task = orchestrator.analyze(region)

        if bbox:
            vessel_task = ais_service.sample_port_vessels(region, bbox, duration_seconds=30)
            analysis_result, vessel_result = await asyncio.gather(
                analysis_task, vessel_task, return_exceptions=True
            )
        else:
            analysis_result = await analysis_task
            vessel_result = None

        # Handle analysis result
        if isinstance(analysis_result, Exception):
            raise analysis_result

        # Build response
        response = {
            "region": region,
            "port_name": region_config.get("port", region),
            "center": {"lat": region_config["lat"], "lon": region_config["lon"]},
            "status": analysis_result.status,
        }

        # Risk assessment data
        if analysis_result.aggregated_risk:
            risk = analysis_result.aggregated_risk
            response["risk_score"] = risk.risk_score
            response["risk_level"] = risk.risk_level
            response["risk_breakdown"] = risk.breakdown
        else:
            response["risk_score"] = None
            response["risk_level"] = None
            response["risk_breakdown"] = {}

        # Individual risk sources
        if analysis_result.news_risk:
            nr = analysis_result.news_risk
            response["news_risk"] = {
                "severity": nr.severity,
                "event_type": nr.event_type,
                "summary": nr.summary,
                "sources": nr.sources,
            }
        else:
            response["news_risk"] = None

        if analysis_result.weather_risk:
            wr = analysis_result.weather_risk
            response["weather_risk"] = {
                "severity": wr.severity,
                "condition": wr.weather_condition,
                "details": wr.details,
                "temperature_c": wr.temperature_c,
                "wind_speed_kmh": wr.wind_speed_kmh,
            }
        else:
            response["weather_risk"] = None

        if analysis_result.port_risk:
            response["port_risk"] = analysis_result.port_risk.model_dump()
        else:
            response["port_risk"] = None

        # AI explanation
        response["explanation"] = analysis_result.explanation

        # ML correlation analysis results
        if analysis_result.ml_analysis:
            response["ml_analysis"] = analysis_result.ml_analysis.model_dump()
        else:
            response["ml_analysis"] = None

        # Live vessel data (from concurrent AIS scan)
        if isinstance(vessel_result, dict) and not isinstance(vessel_result, Exception):
            response["vessel_count"] = vessel_result.get("vessel_count", 0)
            response["vessels"] = vessel_result.get("vessels", [])
            response["bounding_box"] = bbox
            response["avg_speed"] = vessel_result.get("avg_speed", 0)
            response["moving_count"] = vessel_result.get("moving_count", 0)
            response["stationary_count"] = vessel_result.get("stationary_count", 0)
            response["moored_count"] = vessel_result.get("moored_count", 0)
            response["congestion_level"] = vessel_result.get("congestion_level", "unknown")
        else:
            response["vessel_count"] = 0
            response["vessels"] = []
            response["bounding_box"] = bbox
            response["avg_speed"] = 0
            response["moving_count"] = 0
            response["stationary_count"] = 0
            response["moored_count"] = 0
            response["congestion_level"] = "unknown"

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate risk overview: {str(e)}"
        )


@app.get("/ml/status")
async def get_ml_status():
    """
    Get current ML model status — whether it's trained, how many samples
    it has, and its accuracy metrics.
    """
    from backend.ml.correlation_model import get_model
    from backend.services.data_logger import get_record_count
    model = get_model()
    return {
        "is_trained": model.is_trained,
        "training_samples": model.training_samples,
        "total_history_records": get_record_count(),
        "model_r2_risk": round(model.cv_risk_score, 3) if model.is_trained else None,
        "model_r2_delay": round(model.cv_delay_score, 3) if model.is_trained else None,
        "feature_importances": model.feature_importances,
    }


@app.post("/ml/retrain")
async def retrain_ml_model():
    """
    Force retrain the ML model on all accumulated real + seed data.
    Call this after running several analyses to improve model accuracy.
    """
    from backend.ml.correlation_model import get_model
    model = get_model()
    result = model.train()
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
