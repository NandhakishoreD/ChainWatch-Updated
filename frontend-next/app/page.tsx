'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { Header } from '@/components/Header';
import { RegionSelector } from '@/components/RegionSelector';
import { AnalyzeButton } from '@/components/AnalyzeButton';
import { RiskOverviewPanel } from '@/components/RiskOverviewPanel';
import { ChatBot } from '@/components/ChatBot';
import { EmptyState } from '@/components/EmptyState';
import { SystemState, RiskLevel, RiskOverviewData } from '@/lib/types';
import { getRegions, analyzeRegion, getCurrentState } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [regions, setRegions] = useState<string[]>(['Shanghai', 'Rotterdam', 'Los Angeles']);
  const [selectedRegion, setSelectedRegion] = useState('Shanghai');
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const riskLevel: RiskLevel | null = state?.aggregated_risk?.risk_level || null;

  useEffect(() => {
    getRegions().then(setRegions);
    getCurrentState().then((s) => {
      if (s) setState(s);
    });
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRegion(selectedRegion);
      setState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Map SystemState → RiskOverviewData expected by RiskOverviewPanel
  const panelData: RiskOverviewData | null = state
    ? {
      region: state.region,
      port_name: state.region,
      center: { lat: 0, lon: 0 },
      status: state.status,
      risk_score: state.aggregated_risk?.risk_score ?? null,
      risk_level: state.aggregated_risk?.risk_level ?? null,
      risk_breakdown: state.aggregated_risk?.breakdown ?? {},
      news_risk: state.news_risk
        ? {
          severity: state.news_risk.severity,
          event_type: state.news_risk.event_type,
          summary: state.news_risk.summary,
          sources: state.news_risk.sources,
        }
        : null,
      weather_risk: state.weather_risk
        ? {
          severity: state.weather_risk.severity,
          condition: state.weather_risk.weather_condition,
          details: state.weather_risk.details,
          temperature_c: state.weather_risk.temperature_c,
          wind_speed_kmh: state.weather_risk.wind_speed_kmh,
        }
        : null,
      port_risk: state.port_risk
        ? {
          severity: state.port_risk.severity,
          congestion_level: state.port_risk.congestion_level,
          details: state.port_risk.details,
          vessel_queue: state.port_risk.vessel_queue,
          avg_delay_hours: state.port_risk.avg_delay_hours,
        }
        : null,
      ml_analysis: state.ml_analysis ?? null,
      explanation: state.explanation,
      vessel_count: 0,
      vessels: [],
      bounding_box: [],
      avg_speed: 0,
      moving_count: 0,
      stationary_count: 0,
      moored_count: 0,
      congestion_level: state.port_risk?.congestion_level ?? 'unknown',
    }
    : null;

  return (
    <div className="min-h-screen relative" data-risk={riskLevel}>
      <BackgroundEffects riskLevel={riskLevel} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header riskLevel={riskLevel} lastUpdated={state?.timestamp || null} />

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 mb-8"
        >
          <div className="flex flex-wrap items-end gap-6">
            <RegionSelector
              regions={regions}
              selectedRegion={selectedRegion}
              onSelect={setSelectedRegion}
              disabled={loading}
            />
            <AnalyzeButton onClick={handleAnalyze} loading={loading} />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Main content */}
        {!panelData ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={state?.timestamp}
          >
            <RiskOverviewPanel data={panelData} />
          </motion.div>
        )}
      </div>

      <ChatBot />
    </div>
  );
}
