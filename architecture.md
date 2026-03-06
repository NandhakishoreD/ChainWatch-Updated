# ChainWatch Application Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer (Next.js)"
        UI[Dashboard UI & 3D Globe]
        Components[React Components]
        API_Client[API Client]
    end

    subgraph "API Layer (FastAPI)"
        Main[main.py]
        Endpoints[REST Endpoints]
        CORS[CORS Middleware]
    end

    subgraph "Orchestration Layer"
        Orchestrator[Orchestrator]
        State_Store[State Store]
    end

    subgraph "Agent Layer"
        News_Agent[News Agent]
        Weather_Agent[Weather Agent]
        Port_Agent[Port Agent]
        Aggregation_Agent[Aggregation Agent]
        ML_Agent[ML Correlation Agent]
        Explanation_Agent[Explanation Agent]
    end

    subgraph "Machine Learning Engine"
        CorrelationModel[Correlation Model]
        ScikitLearn[Ridge / Random Forest]
        JSON_Tape[risk_history.jsonl]
    end

    subgraph "Service Layer"
        LLM_Service[LLM Service]
        News_API[News API]
        Weather_API[Weather API]
        AIS_Service[AIS Stream Service]
    end

    subgraph "External Services"
        OpenAI[OpenAI API]
        News_Source[External News Sources]
        Weather_Source[Weather Data Sources]
        AISStream[AISStream.io Websocket]
    end

    UI --> API_Client
    API_Client --> Endpoints
    Endpoints --> CORS
    CORS --> Main
    Main --> Orchestrator
    Orchestrator --> State_Store
    Orchestrator --> News_Agent
    Orchestrator --> Weather_Agent
    Orchestrator --> Port_Agent
    Orchestrator --> Aggregation_Agent
    Orchestrator --> ML_Agent
    Orchestrator --> Explanation_Agent
    
    News_Agent --> News_API
    News_API --> News_Source
    Weather_Agent --> Weather_API
    Weather_API --> Weather_Source
    Port_Agent --> AIS_Service
    AIS_Service --> AISStream
    
    News_Agent --> LLM_Service
    Port_Agent --> LLM_Service
    Explanation_Agent --> LLM_Service
    LLM_Service --> OpenAI
    
    ML_Agent --> CorrelationModel
    CorrelationModel --> ScikitLearn
    CorrelationModel --> JSON_Tape
    Main --> State_Store

    style UI fill:#e1f5ff
    style Main fill:#fff4e1
    style Orchestrator fill:#f0e1ff
    style News_Agent fill:#ffe1f0
    style Weather_Agent fill:#e1ffe1
    style Port_Agent fill:#fff0e1
    style Aggregation_Agent fill:#e1f0ff
    style ML_Agent fill:#e1e1ff
    style Explanation_Agent fill:#f0ffe1
    style CorrelationModel fill:#dcefff
    style LLM_Service fill:#ffe1e1
```

## Detailed Data Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ Frontend (Next.js)
    participant API as 🚀 FastAPI Backend
    participant Orch as 🎯 Orchestrator
    participant State as 💾 State Store
    participant Agents as 🤖 Agents
    participant ML as 📊 ML Engine
    participant LLM as 🧠 LLM Service
    participant ExtAPI as 🌐 External APIs

    User->>UI: Select Region & Click Analyze
    UI->>API: POST /analyze/{region}
    API->>Orch: analyze(region)

    Orch->>State: Initialize SystemState
    Orch->>Agents: NewsAgent.run(region)
    Agents->>ExtAPI: Fetch news articles
    ExtAPI-->>Agents: News data
    Agents->>LLM: classify_news_risk(articles)
    LLM-->>Agents: Risk classification
    Agents-->>Orch: News risk result

    Orch->>Agents: WeatherAgent.run(region)
    Agents->>ExtAPI: Fetch weather data
    ExtAPI-->>Agents: Weather data
    Agents-->>Orch: Weather risk result

    Orch->>Agents: PortAgent.run(region)
    Agents->>ExtAPI: Fetch live vessel coordinates
    ExtAPI-->>Agents: AIS binary payload
    Agents->>LLM: Analyze port conditions & heuristics
    LLM-->>Agents: Port risk result
    Agents-->>Orch: Port risk result

    Orch->>Agents: MLAgent.run(news, weather, port)
    Agents->>ML: Predict delay & risk (Random Forest / Ridge)
    ML-->>Agents: ML correlation insights & Feature Importances
    Agents-->>Orch: ML Analysis Dict
    
    Orch->>ML: log_analysis_run() (Save to JSONL dataset)

    Orch->>Agents: AggregationAgent.run()
    Agents-->>Orch: Aggregated risk score (70% Heuristic, 30% ML)

    Orch->>Agents: ExplanationAgent.run()
    Agents->>LLM: generate_explanation(heuristics + ML insights)
    LLM-->>Agents: Statistically grounded explanation
    Agents-->>Orch: Explanation

    Orch->>State: Update with all results
    State-->>Orch: Confirmation
    Orch-->>API: Complete SystemState
    API-->>UI: SystemState response
    UI->>User: Display hybrid risk dashboard

    Note over User,UI: User can now query insights
    User->>UI: Ask question in chat
    UI->>API: POST /chat
    API->>State: Get current state
    State-->>API: SystemState
    API->>LLM: answer_chat_question()
    LLM-->>API: AI response
    API-->>UI: Chat response
    UI->>User: Display answer
```

## Component Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        Dashboard[Risk Overview Panel]
        Header[Header Component]
        Globe[Interactive 3D Globe]
        RiskCards[Risk Cards & Metric Bars]
        MLStats[ML Feature Importances]
        ChatBot[Chat Bot]
    end

    subgraph "API Endpoints"
        Health[GET /health]
        Regions[GET /regions]
        Analyze["POST /analyze/{region}"]
        VesselScan["GET /port/vessels/{region}"]
        GetState[GET /state]
        Retrain["POST /ml/retrain"]
    end

    subgraph "Backend Modules"
        Config[config.py]
        State[state.py]
        Schemas[models/schemas.py]
        SeedData[ml/seed_training_data.py]
    end

    Dashboard --> Header
    Dashboard --> Globe
    Dashboard --> RiskCards
    Dashboard --> MLStats
    Dashboard --> ChatBot

    RiskCards --> Analyze
    Globe --> VesselScan
    ChatBot --> GetState
    MLStats --> Retrain

    Analyze --> Config
    GetState --> State
    Analyze --> Schemas
    Retrain --> SeedData

    style Dashboard fill:#e3f2fd
    style Analyze fill:#fff3e0
    style Retrain fill:#f3e5f5
```

## Agent Architecture

```mermaid
classDiagram
    class BaseAgent {
        <<abstract>>
        +str name
        +__init__(name: str)
        +run(region: str) dict
    }

    class NewsAgent {
        +run(region: str) dict
        -fetch_news(region: str) list
    }

    class WeatherAgent {
        +run(region: str) dict
        -fetch_weather(region: str) dict
    }

    class PortAgent {
        +run(region: str) dict
        -analyze_port_conditions(region: str) dict
    }

    class MLAgent {
        +run(news_risk, weather_risk, port_risk) MLAnalysisOutput
        -predict_delays() float
    }

    class AggregationAgent {
        +run(news, weather, port, ml_risk_score) dict
        -calculate_blended_risk() dict
    }

    class ExplanationAgent {
        +run(news, weather, port, aggregated, ml_analysis) str
    }

    BaseAgent <|-- NewsAgent
    BaseAgent <|-- WeatherAgent
    BaseAgent <|-- PortAgent
    BaseAgent <|-- MLAgent
    BaseAgent <|-- AggregationAgent
    BaseAgent <|-- ExplanationAgent

    class Orchestrator {
        -NewsAgent news_agent
        -WeatherAgent weather_agent
        -PortAgent port_agent
        -MLAgent ml_agent
        -AggregationAgent aggregation_agent
        -ExplanationAgent explanation_agent
        +analyze(region: str) SystemState
    }

    Orchestrator --> NewsAgent
    Orchestrator --> WeatherAgent
    Orchestrator --> PortAgent
    Orchestrator --> MLAgent
    Orchestrator --> AggregationAgent
    Orchestrator --> ExplanationAgent
```

## Service Architecture

```mermaid
graph TB
    subgraph "Core Services"
        LLM[LLMService]
        ML[CorrelationModel (scikit-learn)]
        DataLog[DataLogger (risk_history.jsonl)]
    end

    subgraph "External APIs"
        NewsAPI[News API Service]
        WeatherAPI[Weather API Service]
        AISStream[AISStream Service]
    end

    subgraph "OpenAI Integration"
        Client[AsyncOpenAI Client]
        Model[GPT-4o-mini]
    end

    LLM --> Client
    Client --> Model

    NewsAgent[News Agent] --> NewsAPI
    WeatherAgent[Weather Agent] --> WeatherAPI
    PortAgent[Port Agent] --> AISStream
    MLAgent[ML Agent] --> ML
    ML --> DataLog
    
    NewsAgent --> LLM
    PortAgent --> LLM
    ExplanationAgent[Explanation Agent] --> LLM

    style LLM fill:#ffebee
    style ML fill:#e8f5e9
    style DataLog fill:#fff8e1
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Idle: Application Start

    Idle --> Processing: User clicks Analyze
    Processing --> NewsAnalysis: Orchestrator starts
    NewsAnalysis --> WeatherAnalysis: NewsAgent completes
    WeatherAnalysis --> PortAnalysis: WeatherAgent completes
    PortAnalysis --> MLAnalysis: PortAgent completes
    MLAnalysis --> Aggregation: MLAgent completes
    Aggregation --> Explanation: AggregationAgent completes
    Explanation --> Completed: ExplanationAgent completes

    Completed --> Idle: Ready for new analysis
    Processing --> Error: Exception occurs
    Error --> Idle: Error handled

    state Processing {
        [*] --> NewsAnalysis
        NewsAnalysis --> WeatherAnalysis
        WeatherAnalysis --> PortAnalysis
        PortAnalysis --> MLAnalysis
        MLAnalysis --> Aggregation
        Aggregation --> Explanation
        Explanation --> [*]
    }
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        Next[Next.js 14]
        React[React 18]
        TypeScript[TypeScript]
        Tailwind[Tailwind CSS]
        Lucide[Lucide Icons]
    end

    subgraph "Backend"
        FastAPI[FastAPI]
        Python[Python 3.11+]
        Uvicorn[Uvicorn Server]
        Pydantic[Pydantic]
    end
    
    subgraph "Machine Learning Engine"
        ScikitLearn[scikit-learn]
        Pandas[pandas]
        Numpy[numpy]
    end

    subgraph "External Services"
        OpenAI_API[OpenAI API (GPT-4o-mini)]
        News[News API]
        Weather[OpenWeather API]
        AIS[AISStream.io]
    end

    Next --> React
    React --> TypeScript
    TypeScript --> Tailwind
    Tailwind --> Lucide

    FastAPI --> Python
    Python --> Uvicorn
    Uvicorn --> Pydantic

    FastAPI --> ScikitLearn
    ScikitLearn --> Pandas
    Pandas --> Numpy

    Python --> OpenAI_API
    Python --> News
    Python --> Weather
    Python --> AIS

    style Next fill:#0070f3
    style FastAPI fill:#009688
    style ScikitLearn fill:#f39c12
```

## Key Architecture Patterns

1. **Hybrid AI Architecture**: Combines deterministic rules with scikit-learn Machine Learning heuristics and LLM generative reporting.
2. **Orchestrator Pattern**: Central coordinator manages multiple specialized agents executed sequentially.
3. **ML Interception Pattern**: ML module intercepts agent telemetry dynamically before passing to standard aggregation workflows.
4. **Service Layer Abstraction**: External APIs (OpenWeather, News, AIS Websockets) are completely isolated from Agent logic.
5. **Cold-Start Bootstrapping**: Python scripts artificially seed highly correlated synthetic ground-truth data to bootstrap early Random Forest training.
6. **Data Tape Pipeline**: Real-time analysis streams continually write to JSON Lines formatting (`risk_history.jsonl`) for perpetual auto-training logic.
