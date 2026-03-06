# ChainWatch

**AI-Powered Supply Chain Risk Monitoring System**

ChainWatch is an advanced predictive supply chain monitoring system that utilizes a novel **hybrid architecture**. It orchestrates autonomous AI agents to evaluate real-time deterministic heuristics, and passes that data through a continuous Machine Learning correlation pipeline to deliver highly accurate, data-driven risk assessments and delay predictions for the world's major ports.

![Risk Levels](https://img.shields.io/badge/Risk%20Levels-Low%20%7C%20Medium%20%7C%20High-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Hybrid AI/ML Architecture** - Fuses multi-agent deterministic heuristics with predictive Machine Learning regression forests.
- **Data-Driven Delay Prediction** - Random Forest model predicts exact disruption delays (in hours) based on cross-factor correlations.
- **Live Port Monitor** - Real-time vessel congestion tracking over robust `aiohttp` websockets using raw AIS binary data streams via AISStream.io.
- **Autonomous Orchestration** - Agents automatically fetch, process, and score news severity, weather conditions, and port activity.
- **AI-Powered Explanations** - `gpt-4o-mini` interprets the ML data and heuristic logic to generate polished, statistically-grounded business reports.
- **Interactive Dashboard** - Sleek, Next.js frontend featuring ambient risk theming, a 3D interactive globe, and transparent ML feature importance visualization.

## Supported Regions (17 Ports with Live AIS Coverage)

| Category | Ports |
|----------|-------|
| **US Coverage** | Los Angeles, Long Beach, New York, Savannah, Seattle |
| **Europe & Med** | Rotterdam, Hamburg, Antwerp, Southampton, Valencia, Piraeus |
| **Asia & Mid East** | Singapore, Hong Kong, Shenzhen, Tokyo, Salalah |
| **Canada** | Vancouver |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- API Keys:
  - [OpenAI](https://platform.openai.com) 
  - [NewsAPI](https://newsapi.org) 
  - [OpenWeatherMap](https://openweathermap.org/api)
  - [AISStream.io](https://aisstream.io)

### 1. Clone & Setup Backend

```bash
# Clone the repository
git clone <repository-url>
cd chainWatch

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your keys:

```env
OPENAI_API_KEY=sk-your-openai-key
NEWS_API_KEY=your-newsapi-key
OPENWEATHER_API_KEY=your-openweather-key
AISSTREAM_API_KEY=your-aisstream-key
```

### 3. Bootstrap the Machine Learning Model

To solve the "cold start" problem, ChainWatch uses a local ML model that must be trained before the first run. The repository includes a bootstrap script that safely generates ~200 realistic, highly-correlated historical data samples and trains the initial Random Forest and Ridge Regression models.

```bash
# Generate seed data and automatically train the initial ML model
python -m backend.ml.seed_training_data
```

*(Note: As the system runs in production, it will continuously append real-world analysis runs to `backend/data/risk_history.jsonl` allowing the ML to learn and drift over time).*

### 4. Start the Application

**Backend Server:**
```bash
# From project root
uvicorn backend.main:app --reload --port 8000
```
Backend will be available at `http://localhost:8000`

**Frontend Dashboard:**
```bash
# Open new terminal
cd frontend-next
npm install
npm run dev
```
Frontend will be available at `http://localhost:3000`

---

## Architecture Flow

The system operates via an Orchestrator that flows data sequentially through deterministic APIs, ML correlation tools, and LLM text generation:

```
┌────────────────────────────────────────────────────────┐
│                    Next.js Dashboard                   │
│         (3D Globe + ML Feature Important Charts)       │
└────────────────────────┬───────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼───────────────────────────────┐
│                    FastAPI Backend                     │
└────────────────────────┬───────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────┐
│               1. Agent Orchestrator                    │
│      (Coordinates data fetching mathematically)        │
└──────┬─────────────────┼─────────────────┬─────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  News Agent  │  │Weather Agent │  │  Port Agent  │
│ (LLM + API)  │  │(Rules + API) │  │ (Live AIS)   │
└──────────────┘  └──────────────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
             ┌───────────────────────┐
             │ 2. ML Correlation     │
             │ (Scikit-Learn Forest) │
             │   - Delay Predictor   │
             │   - Feature Import.   │
             └───────────┬───────────┘
                         ▼
             ┌───────────────────────┐
             │ 3. Explanation Agent  │
             │ (LLM interprets ML    │
             │  outputs for humans)  │
             └───────────────────────┘
```

## Risk Calculation & ML Synergy

The final aggregate risk score generated by the system is a mathematically sound blend of deterministic domain knowledge and dynamic ML predictions:

*   **Heuristic Baseline (70%):** A fixed formula measuring raw immediate severity (`0.4 × News + 0.3 × Weather + 0.3 × Port`).
*   **Predictive ML Model (30%):** A Ridge Regression model dynamically analyzing the 10-dimensional feature vector to accurately weight correlated threats (e.g., recognizing a storm occurring simultaneously with a high vessel queue produces exponentially worse delays).

---

## Operations Guide

### Live Port Monitor
Navigate to **Port Monitor** in the header or `/port-monitor`.
- **Scan Port**: Quick 8s scan of live vessel traffic in the area.
- **Full Risk Overview**: Runs the full analysis pipeline (Heuristics + ML Prediction + LLM Explanation) *plus* the live vessel scan concurrently.

### API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/regions` | List available regions |
| POST | `/analyze/{region}` | Run standard hybrid risk analysis |
| GET | `/port/vessels/{region}` | Live AIS vessel scan |
| GET | `/port/risk-overview/{region}` | Full supply chain risk + live AIS |
| POST | `/ml/retrain` | Force standard retraining of the ML models |
| GET | `/ml/status` | Introspect ML Confidence and R2 accuracy |

---

## Project Structure

```
chainWatch/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration & Regions
│   ├── state.py             # In-memory state store
│   ├── orchestrator/        # Agent coordination
│   ├── ml/                  # Machine Learning Engine
│   │   ├── correlation_model.py # Random Forest & Ridge Regression
│   │   ├── seed_training_data.py # Synthetic Bootstrapper
│   ├── agents/
│   │   ├── news_agent.py    # News risk assessment
│   │   ├── weather_agent.py # Weather risk assessment
│   │   ├── port_agent.py    # Port congestion via AIS
│   │   └── ml_agent.py      # ML execution
│   ├── services/
│   │   ├── ais_service.py   # AISStream.io client
│   │   └── ...
│   └── data/
│       └── risk_history.jsonl # Live training tape
├── frontend-next/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── RiskOverviewPanel.tsx # Dashboard Views
│   │   └── ...
│   └── lib/                 # API client
└── ...
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>ChainWatch</strong> - Built with Agentic AI • Machine Learning • Next.js • FastAPI
</p>
