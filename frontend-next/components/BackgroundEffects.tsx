'use client';

import { motion } from 'framer-motion';
import { RiskLevel } from '@/lib/types';

interface BackgroundEffectsProps {
  riskLevel: RiskLevel | null;
}

export function BackgroundEffects({ riskLevel }: BackgroundEffectsProps) {
  return (
    <>
      {/* Ambient glow that changes with risk level */}
      <div className="ambient-glow" />

      {/* Grid pattern */}
      <div className="fixed inset-0 bg-grid opacity-50 pointer-events-none z-0" />

      {/* Floating orbs */}
      <motion.div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, var(--glow-color) 0%, transparent 70%)`,
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, var(--glow-color) 0%, transparent 70%)`,
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Scan line effect for high risk */}
      {riskLevel === 'High' && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="scan-line" />
        </div>
      )}
    </>
  );
}
