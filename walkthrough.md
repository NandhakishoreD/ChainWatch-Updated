# ML Correlation Model Integration — Walkthrough

## What Was Built

A full ML-powered correlation analysis layer was added to ChainWatch, sitting between the individual risk agents and the LLM explanation step. Every real scan now feeds training data back to the model automatically.

## New Files Created

| File | Purpose |
|------|---------|
| [backend/services/data_logger.py](file:///Users/nandhu/Desktop/ChainWatch/backend/services/data_logger.py) | JSONL logger — records every real scan as training data |
| [backend/ml/__init__.py](file:///Users/nandhu/Desktop/ChainWatch/backend/ml/__init__.py) | Package marker |
| [backend/ml/seed_training_data.py](file:///Users/nandhu/Desktop/ChainWatch/backend/ml/seed_training_data.py) | Generates 200 synthetic bootstrap training samples |
| [backend/ml/correlation_model.py](file:///Users/nandhu/Desktop/ChainWatch/backend/ml/correlation_model.py) | Ridge Regression (risk score) + Random Forest (delay estimate) |
| [backend/ml/model.pkl](file:///Users/nandhu/Desktop/ChainWatch/backend/ml/model.pkl) | Saved trained model (auto-reloaded on startup) |
| [backend/data/risk_history.jsonl](file:///Users/nandhu/Desktop/ChainWatch/backend/data/risk_history.jsonl) | Growing history of real + seed analysis runs |
| [backend/agents/ml_agent.py](file:///Users/nandhu/Desktop/ChainWatch/backend/agents/ml_agent.py) | New agent that feeds real data to the ML model |

## Modified Files

| File | Change |
|------|--------|
| [backend/models/schemas.py](file:///Users/nandhu/Desktop/ChainWatch/backend/models/schemas.py) | Added [MLAnalysisOutput](file:///Users/nandhu/Desktop/ChainWatch/backend/models/schemas.py#51-63) schema + `ml_analysis` to [SystemState](file:///Users/nandhu/Desktop/ChainWatch/backend/models/schemas.py#51-63) |
| [backend/orchestrator/orchestrator.py](file:///Users/nandhu/Desktop/ChainWatch/backend/orchestrator/orchestrator.py) | 6-step pipeline: added Step 4 (ML Agent) + data logging |
| [backend/agents/aggregation_agent.py](file:///Users/nandhu/Desktop/ChainWatch/backend/agents/aggregation_agent.py) | Accepts ML score, blends 70% heuristic / 30% ML |
| [backend/agents/explanation_agent.py](file:///Users/nandhu/Desktop/ChainWatch/backend/agents/explanation_agent.py) | Passes ML data to LLM service |
| [backend/services/llm_service.py](file:///Users/nandhu/Desktop/ChainWatch/backend/services/llm_service.py) | LLM prompt now includes ML score, delay, correlations, feature importance |
| [backend/main.py](file:///Users/nandhu/Desktop/ChainWatch/backend/main.py) | Risk-overview response includes `ml_analysis`, added `/ml/status` + `/ml/retrain` |
| [frontend-next/lib/types.ts](file:///Users/nandhu/Desktop/ChainWatch/frontend-next/lib/types.ts) | Added [MLAnalysis](file:///Users/nandhu/Desktop/ChainWatch/frontend-next/lib/types.ts#115-126), [MLCorrelationItem](file:///Users/nandhu/Desktop/ChainWatch/frontend-next/lib/types.ts#108-114) interfaces |
| [frontend-next/components/RiskOverviewPanel.tsx](file:///Users/nandhu/Desktop/ChainWatch/frontend-next/components/RiskOverviewPanel.tsx) | New ML comparison card in the dashboard |
| [requirements.txt](file:///Users/nandhu/Desktop/ChainWatch/requirements.txt) | Added `scikit-learn>=1.4.0`, `pandas>=2.1.0` |

## Pipeline (6 Steps)

```
1. News Agent    → LLM classifies news → severity 1-5
2. Weather Agent → Threshold rules    → severity 1-5
3. Port Agent    → AIS vessel count   → severity + heuristic delay
4. ML Agent      → Ridge (risk score) + Random Forest (delay) + correlations  ← NEW
5. Aggregation   → 70% heuristic + 30% ML blended score
6. Explanation   → GPT-4o-mini with ML context in prompt               ← ENHANCED
```

## Model Performance (on seed data)

| Metric | Value |
|--------|-------|
| Risk Score R² | 1.0 |
| Delay R² | 0.999 |
| Training samples | 200 (seed) + accumulating real data |
| Confidence | 100% at 200+ samples |

## Top Correlations Discovered

- `vessel_count ↔ delay_hours`: **0.936 (strong)**
- `port_severity ↔ delay_hours`: **0.922 (strong)**
- `port_severity ↔ vessel_count`: **0.905 (strong)**

## Feature Importances (for delay prediction)

| Feature | Importance |
|---------|-----------|
| port_severity | 64.7% |
| vessel_count | 35.3% |

## How to Restart

Since you have major new Python files, restart the backend:

```bash
# In your uvicorn terminal — press Ctrl+C, then:
uvicorn backend.main:app --reload --port 8000
```

The frontend (`npm run dev`) needs no restart.

## New API Endpoints

- `GET /ml/status` — Check if model is trained, sample count, R² scores
- `POST /ml/retrain` — Force retrain on all accumulated real data

## Dashboard Changes

The **Full Risk Overview** panel now shows a new **ML CORRELATION ANALYSIS** card (indigo-themed) with:
- **Score Comparison**: Heuristic vs ML risk score side-by-side
- **Feature Importance**: Horizontal bars showing which factors drive the prediction
- **Top Correlations**: Cross-factor correlation scores with strength label
- **ML Delay Estimate**: ML-predicted delay alongside the heuristic delay

## How Real Data Accumulates

Every time you run "Full Risk Overview" for a region:
1. The real AIS/weather/news values are logged to [backend/data/risk_history.jsonl](file:///Users/nandhu/Desktop/ChainWatch/backend/data/risk_history.jsonl)
2. After accumulating real runs, call `POST /ml/retrain` to retrain on real data
3. The model gradually shifts from seed data to your real observed patterns
