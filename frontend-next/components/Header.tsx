'use client';

import { motion } from 'framer-motion';
import { Activity, Shield, Radio, Radar } from 'lucide-react';
import { RiskLevel } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import Link from 'next/link';

interface HeaderProps {
  riskLevel: RiskLevel | null;
  lastUpdated: string | null;
}

export function Header({ riskLevel, lastUpdated }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-20"
    >
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <motion.div
              className="relative w-14 h-14 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              {/* Radar background */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/30" />
              <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.3) 60deg, transparent 120deg)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <Shield className="w-6 h-6 text-cyber-blue relative z-10" />
            </motion.div>

            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wider">
                <span className="text-white">CHAIN</span>
                <span className="text-cyber-blue">WATCH</span>
              </h1>
              <p className="text-sm text-slate-400 font-mono tracking-wide">
                SUPPLY CHAIN RISK MONITOR
              </p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-6">
            {/* Port Monitor Link */}
            <Link
              href="/port-monitor"
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-cyan-500/20"
            >
              <Radar className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Port Monitor</span>
            </Link>

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                System Online
              </span>
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500">
                <Radio className="w-3 h-3" />
                <span>Updated: {formatTimestamp(lastUpdated)}</span>
              </div>
            )}

            {/* Risk Status Badge */}
            {riskLevel && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <div
                  className="px-4 py-2 rounded-lg font-display text-sm font-bold tracking-wider flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, var(--risk-color), color-mix(in srgb, var(--risk-color) 60%, #000))`,
                    boxShadow: `0 0 20px color-mix(in srgb, var(--risk-color) 40%, transparent)`,
                  }}
                >
                  <Activity className="w-4 h-4" />
                  {riskLevel.toUpperCase()} RISK
                </div>
                {riskLevel === 'High' && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2"
                    style={{ borderColor: 'var(--risk-color)' }}
                    animate={{ opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
