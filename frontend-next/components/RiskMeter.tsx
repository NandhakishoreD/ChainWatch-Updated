'use client';

import { motion } from 'framer-motion';
import { AggregatedRisk } from '@/lib/types';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface RiskMeterProps {
  risk: AggregatedRisk | null;
  region: string;
  explanation: string | null;
}

export function RiskMeter({ risk, region, explanation }: RiskMeterProps) {
  if (!risk) return null;

  const getIcon = () => {
    switch (risk.risk_level) {
      case 'Low':
        return <CheckCircle className="w-8 h-8" />;
      case 'Medium':
        return <AlertCircle className="w-8 h-8" />;
      case 'High':
        return <AlertTriangle className="w-8 h-8" />;
    }
  };

  const scorePercentage = (risk.risk_score / 5) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card glass-card-risk rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Corner decorations */}
      <div className="corner-decoration top-left" />
      <div className="corner-decoration top-right" />
      <div className="corner-decoration bottom-left" />
      <div className="corner-decoration bottom-right" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold tracking-wide text-white mb-1">
              {region} Assessment
            </h2>
            <p className="text-sm text-slate-400">Comprehensive risk analysis</p>
          </div>
          <motion.div
            className="p-3 rounded-xl"
            style={{
              background: `linear-gradient(135deg, var(--risk-color), color-mix(in srgb, var(--risk-color) 50%, #000))`,
            }}
            animate={risk.risk_level === 'High' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: risk.risk_level === 'High' ? Infinity : 0 }}
          >
            {getIcon()}
          </motion.div>
        </div>

        {/* Score display */}
        <div className="flex items-end gap-4 mb-6">
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">
              Risk Score
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className="font-display text-5xl font-bold text-glow"
                style={{ color: 'var(--risk-color)' }}
              >
                {risk.risk_score.toFixed(1)}
              </span>
              <span className="text-slate-500 font-mono">/5.0</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="flex-1 pb-2">
            <div className="h-3 bg-void-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, var(--risk-color), color-mix(in srgb, var(--risk-color) 70%, white))`,
                  boxShadow: `0 0 20px var(--risk-color)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${scorePercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.entries(risk.breakdown).filter(([key]) => key !== 'ml_comparison').map(([key, data]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-void-800/50 rounded-xl p-4 border border-white/5"
            >
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                {key}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-white">
                  {data.contribution.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">
                  ({(data.weight * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="mt-2 severity-bar">
                <div
                  className="severity-fill"
                  style={{
                    width: `${(data.severity / 5) * 100}%`,
                    background: 'var(--risk-color)',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Explanation */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-void-800/30 rounded-xl p-4 border border-white/5"
          >
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
              AI Analysis
            </p>
            <p className="text-slate-300 leading-relaxed">{explanation}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
