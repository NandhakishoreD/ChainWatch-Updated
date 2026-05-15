export interface NewsRisk {
  event_type: string;
  severity: number;
  summary: string;
  sources: string[];
}

export interface WeatherRisk {
  weather_condition: string;
  severity: number;
  details: string;
  temperature_c: number | null;
  wind_speed_kmh: number | null;
  rainfall_mm: number | null;
}

export interface PortRisk {
  congestion_level: 'low' | 'moderate' | 'high' | 'critical';
  severity: number;
  details: string;
  vessel_queue: number | null;
  avg_delay_hours: number | null;
  avg_speed: number | null;
  stationary_count: number | null;
  moored_count: number | null;
  data_source: 'ais_live' | 'baseline_estimate';
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface RiskBreakdownItem {
  contribution: number;
  weight: number;
  severity: number;
}

export interface AggregatedRisk {
  risk_score: number;
  risk_level: RiskLevel;
  breakdown: Record<string, RiskBreakdownItem>;
}

export interface SystemState {
  region: string;
  timestamp: string;
  news_risk: NewsRisk | null;
  weather_risk: WeatherRisk | null;
  port_risk: PortRisk | null;
  aggregated_risk: AggregatedRisk | null;
  ml_analysis: MLAnalysis | null;
  explanation: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message: string | null;
}

export interface ChatResponse {
  response: string;
  based_on_data: boolean;
}

// Port Monitor types
export interface VesselData {
  mmsi: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  sog?: number;
  cog?: number;
  true_heading?: number;
  nav_status?: number;
  nav_status_text?: string;
  rate_of_turn?: number;
  call_sign?: string;
  imo_number?: number;
  ship_type?: number;
  ship_type_text?: string;
  destination?: string;
  eta?: string;
  length?: number;
  width?: number;
  draught?: number;
}

export interface PortMonitorData {
  region: string;
  port_name: string;
  bounding_box: number[][];
  center: { lat: number; lon: number };
  vessel_count: number;
  avg_speed: number;
  stationary_count: number;
  moving_count: number;
  moored_count: number;
  congestion_level: string;
  messages_received: number;
  vessels: VesselData[];
  error?: string;
}

export interface PortStatsData {
  region: string;
  port_name: string;
  vessel_count: number;
  avg_speed: number;
  moving_count: number;
  stationary_count: number;
  moored_count: number;
  congestion_level: string;
  ship_type_breakdown: Record<string, number>;
  messages_received: number;
}

export interface MLCorrelationItem {
  factor_1: string;
  factor_2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface MLAnalysis {
  ml_risk_score: number;
  ml_delay_hours: number;
  ml_risk_level: string;
  top_correlations: MLCorrelationItem[];
  feature_importances: Record<string, number>;
  confidence: number;
  training_samples: number;
  model_r2_risk: number;
  model_r2_delay: number;
  port_data_source?: string;
}

// Returned by the backend when not enough real data has been collected yet
export interface ColdStartML {
  status: 'insufficient_data';
  real_records_collected: number;
  required: number;
}

// Risk Overview types
export interface RiskSourceData {
  severity: number;
  [key: string]: unknown;
}

export interface RiskOverviewData {
  region: string;
  port_name: string;
  center: { lat: number; lon: number };
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  risk_breakdown: Record<string, { severity: number; weight: number; contribution: number }>;
  news_risk: {
    severity: number;
    event_type: string;
    summary: string;
    sources: string[];
  } | null;
  weather_risk: {
    severity: number;
    condition: string;
    details: string;
    temperature_c: number | null;
    wind_speed_kmh: number | null;
  } | null;
  port_risk: PortRisk | null;
  ml_analysis: MLAnalysis | ColdStartML | null;
  explanation: string | null;
  vessel_count: number;
  vessels: VesselData[];
  bounding_box: number[][];
  avg_speed: number;
  moving_count: number;
  stationary_count: number;
  moored_count: number;
  congestion_level: string;
}
