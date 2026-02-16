'use client';

import { motion } from 'framer-motion';
import {
    Newspaper,
    CloudRain,
    Anchor,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Info,
    Wind,
    Thermometer,
    Clock,
    Ship,
} from 'lucide-react';
import { RiskOverviewData } from '@/lib/types';

interface RiskOverviewPanelProps {
    data: RiskOverviewData;
}

function getRiskColor(level: string | null): string {
    switch (level) {
        case 'Low': return '#10b981';
        case 'Medium': return '#f59e0b';
        case 'High': return '#ef4444';
        default: return '#64748b';
    }
}

function getSeverityColor(severity: number): string {
    if (severity <= 2) return '#10b981';
    if (severity <= 3) return '#f59e0b';
    return '#ef4444';
}

function getSeverityLabel(severity: number): string {
    if (severity <= 1) return 'MINIMAL';
    if (severity <= 2) return 'LOW';
    if (severity <= 3) return 'MODERATE';
    if (severity <= 4) return 'HIGH';
    return 'CRITICAL';
}

function SeverityBar({ severity, maxSeverity = 5 }: { severity: number; maxSeverity?: number }) {
    const percentage = (severity / maxSeverity) * 100;
    const color = getSeverityColor(severity);

    return (
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
            />
        </div>
    );
}

export function RiskOverviewPanel({ data }: RiskOverviewPanelProps) {
    const riskColor = getRiskColor(data.risk_level);
    const riskScore = data.risk_score ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Main Risk Score */}
            <div
                className="glass-card rounded-2xl p-6 relative overflow-hidden"
                style={{
                    borderColor: `${riskColor}25`,
                    boxShadow: `0 0 40px ${riskColor}10`,
                }}
            >
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(ellipse at 30% 0%, ${riskColor}08 0%, transparent 60%)`,
                    }}
                />

                <div className="relative z-10">
                    <div className="flex items-start justify-between flex-wrap gap-6">
                        {/* Score display */}
                        <div className="flex items-center gap-6">
                            <motion.div
                                className="relative w-24 h-24 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            >
                                {/* Risk ring */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth="6"
                                    />
                                    <motion.circle
                                        cx="50" cy="50" r="42"
                                        fill="none"
                                        stroke={riskColor}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(riskScore / 5) * 264} 264`}
                                        initial={{ strokeDasharray: '0 264' }}
                                        animate={{ strokeDasharray: `${(riskScore / 5) * 264} 264` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                    />
                                </svg>

                                <div className="text-center">
                                    <span className="font-display text-3xl font-bold" style={{ color: riskColor }}>
                                        {riskScore.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-slate-500 block font-mono">/5.0</span>
                                </div>
                            </motion.div>

                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-display text-lg font-bold text-white tracking-wide">
                                        SUPPLY CHAIN RISK
                                    </h3>
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
                                        style={{
                                            background: `${riskColor}15`,
                                            color: riskColor,
                                            border: `1px solid ${riskColor}35`,
                                        }}
                                    >
                                        {data.risk_level ?? 'Unknown'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 font-mono">
                                    {data.port_name} • Weighted aggregate of all risk factors
                                </p>
                            </div>
                        </div>

                        {/* Weight breakdown mini */}
                        {data.risk_breakdown && Object.keys(data.risk_breakdown).length > 0 && (
                            <div className="flex gap-4">
                                {Object.entries(data.risk_breakdown).map(([key, val]) => (
                                    <div key={key} className="text-center">
                                        <div
                                            className="text-lg font-display font-bold"
                                            style={{ color: getSeverityColor(val.severity) }}
                                        >
                                            {val.contribution.toFixed(1)}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                            {key} ({(val.weight * 100).toFixed(0)}%)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Individual Risk Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* News Risk */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card rounded-xl p-5 space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: data.news_risk
                                        ? `${getSeverityColor(data.news_risk.severity)}15`
                                        : 'rgba(100,116,139,0.1)',
                                    border: `1px solid ${data.news_risk
                                        ? getSeverityColor(data.news_risk.severity)
                                        : '#64748b'}30`,
                                }}
                            >
                                <Newspaper className="w-4 h-4" style={{
                                    color: data.news_risk ? getSeverityColor(data.news_risk.severity) : '#64748b'
                                }} />
                            </div>
                            <span className="font-display text-sm font-semibold text-white tracking-wide">
                                NEWS
                            </span>
                        </div>
                        {data.news_risk && (
                            <span
                                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                                style={{
                                    color: getSeverityColor(data.news_risk.severity),
                                    background: `${getSeverityColor(data.news_risk.severity)}15`,
                                }}
                            >
                                {getSeverityLabel(data.news_risk.severity)}
                            </span>
                        )}
                    </div>
                    {data.news_risk && (
                        <>
                            <SeverityBar severity={data.news_risk.severity} />
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                                {data.news_risk.summary}
                            </p>
                            {data.news_risk.event_type !== 'none' && (
                                <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs font-mono text-amber-400 capitalize">
                                        {data.news_risk.event_type}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                    {!data.news_risk && (
                        <p className="text-xs text-slate-500">No news data available</p>
                    )}
                </motion.div>

                {/* Weather Risk */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card rounded-xl p-5 space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: data.weather_risk
                                        ? `${getSeverityColor(data.weather_risk.severity)}15`
                                        : 'rgba(100,116,139,0.1)',
                                    border: `1px solid ${data.weather_risk
                                        ? getSeverityColor(data.weather_risk.severity)
                                        : '#64748b'}30`,
                                }}
                            >
                                <CloudRain className="w-4 h-4" style={{
                                    color: data.weather_risk ? getSeverityColor(data.weather_risk.severity) : '#64748b'
                                }} />
                            </div>
                            <span className="font-display text-sm font-semibold text-white tracking-wide">
                                WEATHER
                            </span>
                        </div>
                        {data.weather_risk && (
                            <span
                                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                                style={{
                                    color: getSeverityColor(data.weather_risk.severity),
                                    background: `${getSeverityColor(data.weather_risk.severity)}15`,
                                }}
                            >
                                {getSeverityLabel(data.weather_risk.severity)}
                            </span>
                        )}
                    </div>
                    {data.weather_risk && (
                        <>
                            <SeverityBar severity={data.weather_risk.severity} />
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                {data.weather_risk.condition}
                            </p>
                            <div className="flex gap-4 text-xs font-mono text-slate-500">
                                {data.weather_risk.temperature_c != null && (
                                    <div className="flex items-center gap-1">
                                        <Thermometer className="w-3 h-3" />
                                        {data.weather_risk.temperature_c.toFixed(0)}°C
                                    </div>
                                )}
                                {data.weather_risk.wind_speed_kmh != null && (
                                    <div className="flex items-center gap-1">
                                        <Wind className="w-3 h-3" />
                                        {data.weather_risk.wind_speed_kmh.toFixed(0)} km/h
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    {!data.weather_risk && (
                        <p className="text-xs text-slate-500">No weather data available</p>
                    )}
                </motion.div>

                {/* Port Risk */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card rounded-xl p-5 space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: data.port_risk
                                        ? `${getSeverityColor(data.port_risk.severity)}15`
                                        : 'rgba(100,116,139,0.1)',
                                    border: `1px solid ${data.port_risk
                                        ? getSeverityColor(data.port_risk.severity)
                                        : '#64748b'}30`,
                                }}
                            >
                                <Anchor className="w-4 h-4" style={{
                                    color: data.port_risk ? getSeverityColor(data.port_risk.severity) : '#64748b'
                                }} />
                            </div>
                            <span className="font-display text-sm font-semibold text-white tracking-wide">
                                PORT
                            </span>
                        </div>
                        {data.port_risk && (
                            <span
                                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                                style={{
                                    color: getSeverityColor(data.port_risk.severity),
                                    background: `${getSeverityColor(data.port_risk.severity)}15`,
                                }}
                            >
                                {getSeverityLabel(data.port_risk.severity)}
                            </span>
                        )}
                    </div>
                    {data.port_risk && (
                        <>
                            <SeverityBar severity={data.port_risk.severity} />
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                {data.port_risk.details}
                            </p>
                            <div className="flex gap-4 text-xs font-mono text-slate-500">
                                {data.port_risk.vessel_queue != null && (
                                    <div className="flex items-center gap-1">
                                        <Ship className="w-3 h-3" />
                                        {data.port_risk.vessel_queue} ships
                                    </div>
                                )}
                                {data.port_risk.avg_delay_hours != null && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        ~{data.port_risk.avg_delay_hours.toFixed(0)}h delay
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    {!data.port_risk && (
                        <p className="text-xs text-slate-500">No port data available</p>
                    )}
                </motion.div>
            </div>

            {/* AI Explanation */}
            {data.explanation && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                            <Info className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="font-display text-sm font-semibold text-white tracking-wide">
                            AI RISK ASSESSMENT
                        </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {data.explanation}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
