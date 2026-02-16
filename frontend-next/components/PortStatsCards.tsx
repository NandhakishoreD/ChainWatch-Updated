'use client';

import { motion } from 'framer-motion';
import {
    Ship,
    Anchor,
    Navigation,
    Gauge,
    Activity,
    Waves,
} from 'lucide-react';
import { PortMonitorData } from '@/lib/types';

interface PortStatsCardsProps {
    data: PortMonitorData;
}

function getCongestionColor(level: string): string {
    switch (level) {
        case 'low': return '#10b981';
        case 'moderate': return '#f59e0b';
        case 'high': return '#ef4444';
        case 'critical': return '#dc2626';
        default: return '#64748b';
    }
}

function getCongestionGlow(level: string): string {
    switch (level) {
        case 'low': return 'rgba(16, 185, 129, 0.15)';
        case 'moderate': return 'rgba(245, 158, 11, 0.15)';
        case 'high': return 'rgba(239, 68, 68, 0.15)';
        case 'critical': return 'rgba(220, 38, 38, 0.2)';
        default: return 'rgba(100, 116, 139, 0.1)';
    }
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
    delay: number;
}

function StatCard({ icon, label, value, subtitle, color, delay }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass-card rounded-xl p-4 relative overflow-hidden group"
        >
            <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle at 50% 0%, ${color}15 0%, transparent 70%)`,
                }}
            />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${color}25, ${color}10)`,
                            border: `1px solid ${color}35`,
                        }}
                    >
                        <span style={{ color }}>{icon}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                        {label}
                    </span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span
                        className="font-display text-3xl font-bold"
                        style={{ color }}
                    >
                        {value}
                    </span>
                    {subtitle && (
                        <span className="text-xs text-slate-500 font-mono">{subtitle}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export function PortStatsCards({ data }: PortStatsCardsProps) {
    const congestionColor = getCongestionColor(data.congestion_level);

    return (
        <div className="space-y-4">
            {/* Congestion level banner */}
            <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                className="glass-card rounded-xl p-4 relative overflow-hidden"
                style={{
                    borderColor: `${congestionColor}30`,
                    boxShadow: `0 0 30px ${getCongestionGlow(data.congestion_level)}`,
                }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: congestionColor }}
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-sm font-display font-semibold tracking-wide text-white">
                            PORT CONGESTION
                        </span>
                        <span
                            className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
                            style={{
                                background: `${congestionColor}20`,
                                color: congestionColor,
                                border: `1px solid ${congestionColor}40`,
                            }}
                        >
                            {data.congestion_level}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-slate-500" />
                        <span className="text-xs font-mono text-slate-500">
                            {data.messages_received} AIS messages
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard
                    icon={<Ship className="w-4 h-4" />}
                    label="Total"
                    value={data.vessel_count}
                    subtitle="vessels"
                    color="#06b6d4"
                    delay={0.1}
                />
                <StatCard
                    icon={<Gauge className="w-4 h-4" />}
                    label="Avg Speed"
                    value={data.avg_speed}
                    subtitle="knots"
                    color="#8b5cf6"
                    delay={0.15}
                />
                <StatCard
                    icon={<Navigation className="w-4 h-4" />}
                    label="Moving"
                    value={data.moving_count}
                    subtitle="underway"
                    color="#10b981"
                    delay={0.2}
                />
                <StatCard
                    icon={<Anchor className="w-4 h-4" />}
                    label="Anchored"
                    value={data.stationary_count}
                    subtitle="waiting"
                    color="#f59e0b"
                    delay={0.25}
                />
                <StatCard
                    icon={<Waves className="w-4 h-4" />}
                    label="Moored"
                    value={data.moored_count}
                    subtitle="at berth"
                    color="#ef4444"
                    delay={0.3}
                />
            </div>
        </div>
    );
}
