# ChainWatch

**AI-Powered Supply Chain Risk Monitoring System**

ChainWatch is an agentic MVP that monitors supply chain risks using orchestrated AI agents, LLMs for intelligent classification, and live external data sources. It provides real-time risk assessments for major global ports.

![Risk Levels](https://img.shields.io/badge/Risk%20Levels-Low%20%7C%20Medium%20%7C%20High-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Multi-Agent Architecture** - Orchestrated agents for news, weather, and port analysis
- **Live Port Monitor** - Real-time vessel tracking using AIS data (Position & Static reports)
- **Full Risk Overview** - Combined analysis of supply chain risks + live vessel data
- **AI-Powered Classification** - GPT-4o-mini for news event classification and explanations
- **Dynamic Risk Scoring** - Weighted aggregation with transparent breakdowns
- **Interactive Dashboard** - Sleek Next.js frontend with ambient risk-based theming and dark mode map
- **AI Chatbot** - Ask questions about the current risk assessment

## Supported Regions (19 Ports)

| Category | Ports |
|----------|-------|
| **Major Congested** | Shanghai, Rotterdam, Los Angeles, Singapore, Busan, Dubai, Hamburg, Antwerp, Hong Kong, Shenzhen, Tokyo, New York |
| **Medium Traffic** | Colombo, Piraeus |
| **Low Congestion** | Tanjung Pelepas, Salalah |
| **🇮🇳 Indian Ports** | Chennai, Tuticorin, Cochin |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- API Keys:
  - [OpenAI](https://platform.openai.com) - For AI classification
  - [NewsAPI](https://newsapi.org) - For news data
  - [OpenWeatherMap](https://openweathermap.org/api) - For weather data
  - [AISStream.io](https://aisstream.io) - For live vessel tracking

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

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your API keys:

```env
OPENAI_API_KEY=sk-your-openai-key
NEWS_API_KEY=your-newsapi-key
OPENWEATHER_API_KEY=your-openweather-key
AISSTREAM_API_KEY=your-aisstream-key
```

### 3. Start Backend Server

```bash
# From project root
uvicorn backend.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### 4. Setup & Start Frontend

```bash
# Open new terminal
cd frontend-next

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Dashboard                     │
│         (Risk Dashboard + Live Port Monitor)            │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────┐
│                    FastAPI Backend                       │
│        /analyze/{region}  •  /port/vessels/{region}      │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                     Orchestrator                         │
│            (Coordinates all agents sequentially)         │
└───────┬─────────────────┼─────────────────┬─────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  News Agent   │ │ Weather Agent │ │  Port Agent   │
│   (LLM + API) │ │  (Rules + API)│ │ (Live AIS)    │
└───────────────┘ └───────────────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
              ┌───────────────────────┐
              │  Aggregation Agent    │
              │  (Weighted Formula)   │
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │  Explanation Agent    │
              │  (LLM Summary)        │
              └───────────────────────┘
```

## Risk Calculation

Risk scores are calculated using transparent weighted aggregation:

```
Risk Score = 0.4 × News + 0.3 × Weather + 0.3 × Port
```

| Risk Level | Score Range | Color |
|------------|-------------|-------|
| Low | < 2.5 | Green |
| Medium | 2.5 - 3.5 | Amber |
| High | > 3.5 | Red |

---

## Operations Guide

### Live Port Monitor
Navigate to **Port Monitor** in the header or `/port-monitor`.
- **Scan Port**: Quick 30s scan of live vessel traffic in the area.
- **Full Risk Overview**: Runs the full analysis pipeline (News + Weather + Port Risk) *plus* the live vessel scan concurrently.

### API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/regions` | List available regions |
| POST | `/analyze/{region}` | Run standard risk analysis |
| GET | `/port/vessels/{region}` | Live AIS vessel scan |
| GET | `/port/risk-overview/{region}` | Full supply chain risk + live AIS |
| POST | `/chat` | Chat with AI about risks |

---

## Project Structure

```
chainWatch/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration & Regions
│   ├── state.py             # In-memory state store
│   ├── orchestrator/        # Agent coordination
│   ├── agents/
│   │   ├── news_agent.py    # News risk assessment
│   │   ├── weather_agent.py # Weather risk assessment
│   │   ├── port_agent.py    # Port congestion via AIS
│   │   └── ...
│   ├── services/
│   │   ├── ais_service.py   # AISStream.io client
│   │   ├── news_api.py      # NewsAPI client
│   │   └── ...
│   └── models/              # Pydantic schemas
├── frontend-next/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── VesselMap.tsx    # Leaflet map
│   │   └── ...
│   └── lib/                 # API client
└── ...
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>ChainWatch</strong> - Built with Agentic AI • Next.js • FastAPI
</p>
