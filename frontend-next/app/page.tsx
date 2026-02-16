'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { Header } from '@/components/Header';
import { RegionSelector } from '@/components/RegionSelector';
import { AnalyzeButton } from '@/components/AnalyzeButton';
import { RiskMeter } from '@/components/RiskMeter';
import { NewsRiskCard, WeatherRiskCard, PortRiskCard } from '@/components/RiskCard';
import { ChatBot } from '@/components/ChatBot';
import { EmptyState } from '@/components/EmptyState';
import { SystemState, RiskLevel } from '@/lib/types';
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
    // Fetch regions on mount
    getRegions().then(setRegions);
    // Check for existing state
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

  return (
    <div
      className="min-h-screen relative"
      data-risk={riskLevel}
    >
      <BackgroundEffects riskLevel={riskLevel} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          riskLevel={riskLevel}
          lastUpdated={state?.timestamp || null}
        />

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
            <AnalyzeButton
              onClick={handleAnalyze}
              loading={loading}
            />
          </div>

          {/* Error message */}
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
        {!state ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={state.timestamp}
          >
            {/* Risk Meter */}
            <div className="mb-8">
              <RiskMeter
                risk={state.aggregated_risk}
                region={state.region}
                explanation={state.explanation}
              />
            </div>

            {/* Risk Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="font-display text-lg font-bold tracking-wide text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--risk-color)' }} />
                RISK BREAKDOWN
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <NewsRiskCard data={state.news_risk} delay={0.5} />
                <WeatherRiskCard data={state.weather_risk} delay={0.6} />
                <PortRiskCard data={state.port_risk} delay={0.7} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Chat Bot */}
      <ChatBot />
    </div>
  );
}
