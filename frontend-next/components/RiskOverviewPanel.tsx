'use client';

import { motion } from 'framer-motion';
import {
    Newspaper,
    CloudRain,
    Anchor,
    AlertTriangle,
    Info,
    Wind,
    Thermometer,
    Clock,
    Ship,
    Brain,
    BarChart2,
    GitCompare,
    Activity,
} from 'lucide-react';
import { RiskOverviewData, MLCorrelationItem, ColdStartML, MLAnalysis } from '@/lib/types';

// Type guard to check if ml_analysis is a cold-start placeholder
function isColdStart(ml: MLAnalysis | ColdStartML | null): ml is ColdStartML {
    return ml !== null && 'status' in ml && ml.status === 'insufficient_data';
}
function isMLAnalysis(ml: MLAnalysis | ColdStartML | null): ml is MLAnalysis {
    return ml !== null && 'ml_risk_score' in ml;
}

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

function FeatureBar({ name, value, max }: { name: string; value: number; max: number }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 w-28 truncate">{name.replace(/_/g, ' ')}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-indigo-400"
                />
            </div>
            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{value.toFixed(0)}%</span>
        </div>
    );
}

export function RiskOverviewPanel({ data }: RiskOverviewPanelProps) {
    const riskColor = getRiskColor(data.risk_level);
    const riskScore = data.risk_score ?? 0;
    const ml = isMLAnalysis(data.ml_analysis) ? data.ml_analysis : null;
    const coldStart = isColdStart(data.ml_analysis) ? data.ml_analysis : null;

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
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
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
                                {ml && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Brain className="w-3 h-3 text-indigo-400" />
                                        <span className="text-xs font-mono text-indigo-400">
                                            ML score: {ml.ml_risk_score.toFixed(1)}/5 • {ml.ml_risk_level}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weight breakdown mini */}
                        {data.risk_breakdown && Object.keys(data.risk_breakdown).length > 0 && (
                            <div className="flex gap-4">
                                {Object.entries(data.risk_breakdown)
                                    .filter(([key]) => key !== 'ml_comparison')
                                    .map(([key, val]) => (
                                        <div key={key} className="text-center">
                                            <div className="text-lg font-display font-bold" style={{ color: getSeverityColor(val.severity) }}>
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: data.news_risk ? `${getSeverityColor(data.news_risk.severity)}15` : 'rgba(100,116,139,0.1)',
                                    border: `1px solid ${data.news_risk ? getSeverityColor(data.news_risk.severity) : '#64748b'}30`,
                                }}
                            >
                                <Newspaper className="w-4 h-4" style={{ color: data.news_risk ? getSeverityColor(data.news_risk.severity) : '#64748b' }} />
                            </div>
                            <span className="font-display text-sm font-semibold text-white tracking-wide">NEWS</span>
                        </div>
                        {data.news_risk && (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                    style={{ color: getSeverityColor(data.news_risk.severity), background: `${getSeverityColor(data.news_risk.severity)}15` }}>
                                    {getSeverityLabel(data.news_risk.severity)}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-display text-xl font-bold" style={{ color: getSeverityColor(data.news_risk.severity) }}>
                                        {data.news_risk.severity}
                                    </span>
                                    <span className="text-xs font-mono text-slate-500">/5</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {data.news_risk && (
                        <>
                            <SeverityBar severity={data.news_risk.severity} />
                            <p className="text-xs text-slate-400 leading-relaxed">{data.news_risk.summary}</p>
                            {data.news_risk.event_type !== 'none' && (
                                <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs font-mono text-amber-400 capitalize">{data.news_risk.event_type}</span>
                                </div>
                            )}
                        </>
                    )}
                    {!data.news_risk && <p className="text-xs text-slate-500">No news data available</p>}
                </motion.div>

                {/* Weather Risk */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: data.weather_risk ? `${getSeverityColor(data.weather_risk.severity)}15` : 'rgba(100,116,139,0.1)',
                                    border: `1px solid ${data.weather_risk ? getSeverityColor(data.weather_risk.severity) : '#64748b'}30`,
                                }}
                            >
                                <CloudRain className="w-4 h-4" style={{ color: data.weather_risk ? getSeverityColor(data.weather_risk.severity) : '#64748b' }} />
                            </div>
                            <span className="font-display text-sm font-semibold text-white tracking-wide">WEATHER</span>
                        </div>
                        {data.weather_risk && (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                    style={{ color: getSeverityColor(data.weather_risk.severity), background: `${getSeverityColor(data.weather_risk.severity)}15` }}>
                                    {getSeverityLabel(data.weather_risk.severity)}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-display text-xl font-bold" style={{ color: getSeverityColor(data.weather_risk.severity) }}>
                                        {data.weather_risk.severity}
                                    </span>
                                    <span className="text-xs font-mono text-slate-500">/5</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {data.weather_risk && (
                        <>
                            <SeverityBar severity={data.weather_risk.severity} />
                            <p className="text-xs text-slate-400 leading-relaxed">{data.weather_risk.condition}</p>
                            <div className="flex gap-4 text-xs font-mono text-slate-500">
                                {data.weather_risk.temperature_c != null && (
                                    <div className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{data.weather_risk.temperature_c.toFixed(0)}°C</div>
                                )}
                                {data.weather_risk.wind_speed_kmh != null && (
                                    <div className="flex items-center gap-1"><Wind className="w-3 h-3" />{data.weather_risk.wind_speed_kmh.toFixed(0)} km/h</div>
                                )}
                            </div>
                        </>
                    )}
                    {!data.weather_risk && <p className="text-xs text-slate-500">No weather data available</p>}
                </motion.div>

                {/* Port Risk */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: data.port_risk ? `${getSeverityColor(data.port_risk.severity)}15` : 'rgba(100,116,139,0.1)',
                                    border: `1px solid ${data.port_risk ? getSeverityColor(data.port_risk.severity) : '#64748b'}30`,
                                }}
                            >
                                <Anchor className="w-4 h-4" style={{ color: data.port_risk ? getSeverityColor(data.port_risk.severity) : '#64748b' }} />
                            </div>
                            <span className="font-display text-sm font-semibold text-white tracking-wide">PORT</span>
                        </div>
                        {data.port_risk && (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                    style={{ color: getSeverityColor(data.port_risk.severity), background: `${getSeverityColor(data.port_risk.severity)}15` }}>
                                    {getSeverityLabel(data.port_risk.severity)}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-display text-xl font-bold" style={{ color: getSeverityColor(data.port_risk.severity) }}>
                                        {data.port_risk.severity}
                                    </span>
                                    <span className="text-xs font-mono text-slate-500">/5</span>
                                </div>
                            </div>
                        )}
                    </div>
                        {data.port_risk && (
                            <>
                                <SeverityBar severity={data.port_risk.severity} />
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-400 leading-relaxed flex-1">{data.port_risk.details}</p>
                                </div>
                                {/* AIS data source badge */}
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                                        style={{
                                            color: data.port_risk.data_source === 'ais_live' ? '#10b981' : '#f59e0b',
                                            background: data.port_risk.data_source === 'ais_live' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                            border: `1px solid ${data.port_risk.data_source === 'ais_live' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                        }}
                                    >
                                        {data.port_risk.data_source === 'ais_live' ? '● AIS LIVE' : '⚠ ESTIMATED'}
                                    </span>
                                </div>
                            <div className="flex gap-4 text-xs font-mono text-slate-500">
                                {data.port_risk.vessel_queue != null && (
                                    <div className="flex items-center gap-1"><Ship className="w-3 h-3" />{data.port_risk.vessel_queue} ships</div>
                                )}
                                {data.port_risk.avg_delay_hours != null && (
                                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />~{data.port_risk.avg_delay_hours.toFixed(0)}h delay</div>
                                )}
                            </div>
                        </>
                    )}
                    {!data.port_risk && <p className="text-xs text-slate-500">No port data available</p>}
                </motion.div>
            </div>

            {/* Cold-start ML card — shown while collecting real data */}
            {coldStart && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="glass-card rounded-xl p-5"
                    style={{ borderColor: 'rgba(99,102,241,0.2)', boxShadow: '0 0 20px rgba(99,102,241,0.04)' }}
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Brain className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-display text-sm font-semibold text-white tracking-wide">ML CORRELATION ANALYSIS</span>
                                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5">COLLECTING DATA</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                The ML model trains exclusively on real AIS data collected from live analyses.
                                It will activate automatically after <strong className="text-white">{coldStart.required} real runs</strong>.
                                Run analyses to build up the dataset.
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (coldStart.real_records_collected / coldStart.required) * 100)}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-indigo-400"
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                    {coldStart.real_records_collected} / {coldStart.required} runs
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}


            {ml && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="glass-card rounded-xl p-5 space-y-4"
                    style={{ borderColor: 'rgba(99,102,241,0.25)', boxShadow: '0 0 30px rgba(99,102,241,0.06)' }}
                >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                                <Brain className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <span className="font-display text-sm font-semibold text-white tracking-wide">ML CORRELATION ANALYSIS</span>
                                <span className="ml-2 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5">
                                    {(ml.confidence * 100).toFixed(0)}% confidence
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                            <span>{ml.training_samples} samples</span>
                            <span>R²={ml.model_r2_risk.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Score Comparison */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <GitCompare className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Score Comparison</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-mono">Heuristic</span>
                                    <span className="text-xs font-mono font-bold" style={{ color: getRiskColor(data.risk_level) }}>
                                        {data.risk_score?.toFixed(1) ?? '—'}/5
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((data.risk_score ?? 0) / 5) * 100}%` }}
                                        transition={{ duration: 0.8 }}
                                        className="h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${getRiskColor(data.risk_level)}80, ${getRiskColor(data.risk_level)})` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-indigo-400 font-mono">ML Model</span>
                                    <span className="text-xs font-mono font-bold" style={{ color: getRiskColor(ml.ml_risk_level) }}>
                                        {ml.ml_risk_score.toFixed(1)}/5
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(ml.ml_risk_score / 5) * 100}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="h-full rounded-full bg-indigo-400"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 font-mono">ML Delay Est.</span>
                                    <span className="text-xs font-mono font-bold text-indigo-300">~{ml.ml_delay_hours.toFixed(0)}h</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature Importances */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 mb-2">
                                <BarChart2 className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Feature Importance</span>
                            </div>
                            {Object.entries(ml.feature_importances)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([name, value]) => {
                                    const max = Math.max(...Object.values(ml.feature_importances));
                                    return <FeatureBar key={name} name={name} value={value} max={max} />;
                                })}
                        </div>

                        {/* Top Correlations */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Activity className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Top Correlations</span>
                            </div>
                            {ml.top_correlations.slice(0, 4).map((c: MLCorrelationItem, i: number) => {
                                const absCorr = Math.abs(c.correlation);
                                const corrColor = c.strength === 'strong' ? '#818cf8' : c.strength === 'moderate' ? '#6366f1' : '#4f46e5';
                                return (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-mono text-slate-400 truncate">
                                                {c.factor_1.replace(/_/g, ' ')} ↔ {c.factor_2.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-10 h-1 rounded-full bg-white/5 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${absCorr * 100}%`, background: corrColor }} />
                                            </div>
                                            <span className="text-[10px] font-mono w-8 text-right" style={{ color: corrColor }}>
                                                {c.correlation.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}

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
                        <span className="font-display text-sm font-semibold text-white tracking-wide">AI RISK ASSESSMENT</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{data.explanation}</p>
                </motion.div>
            )}
        </motion.div>
    );
}
