'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { PortStatsCards } from '@/components/PortStatsCards';
import { VesselTable } from '@/components/VesselTable';
import { RiskOverviewPanel } from '@/components/RiskOverviewPanel';
import { PortMonitorData, RiskOverviewData } from '@/lib/types';
import { getPortVessels, getPortRiskOverview, getRegions } from '@/lib/api';
import {
    AlertCircle,
    RefreshCw,
    Radar,
    Shield,
    ArrowLeft,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import VesselMap to avoid SSR issues with Leaflet
const VesselMap = dynamic(
    () => import('@/components/VesselMap').then((mod) => mod.VesselMap),
    {
        ssr: false,
        loading: () => (
            <div className="glass-card rounded-2xl h-[450px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="spinner" />
                    <span className="text-sm text-slate-400 font-mono">Loading map...</span>
                </div>
            </div>
        ),
    }
);

export default function PortMonitorPage() {
    const [regions, setRegions] = useState<string[]>([
        'Antwerp', 'Busan', 'Hamburg', 'Hong Kong', 'Long Beach',
        'Los Angeles', 'New York', 'Ningbo', 'Piraeus', 'Rotterdam',
        'Salalah', 'Savannah', 'Seattle', 'Shanghai', 'Shenzhen',
        'Singapore', 'Southampton', 'Tokyo', 'Valencia', 'Vancouver',
    ]);
    const [selectedRegion, setSelectedRegion] = useState('Rotterdam');
    const [data, setData] = useState<PortMonitorData | null>(null);
    const [riskOverview, setRiskOverview] = useState<RiskOverviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingRisk, setLoadingRisk] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<string | null>(null);

    useEffect(() => {
        getRegions().then(r => setRegions([...r].sort())).catch(() => { });
    }, []);

    const fetchVessels = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Wake up Render backend first (free tier sleeps after inactivity)
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await fetch(`${apiBase}/health`).catch(() => {});
            // Small delay to allow backend to fully initialise
            await new Promise(r => setTimeout(r, 3000));
            const result = await getPortVessels(selectedRegion);
            setData(result);
            setRiskOverview(null);
            setLastFetched(new Date().toLocaleTimeString());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch vessel data');
        } finally {
            setLoading(false);
        }
    }, [selectedRegion]);

    const fetchRiskOverview = useCallback(async () => {
        setLoadingRisk(true);
        setError(null);
        try {
            // Wake up Render backend first (free tier sleeps after inactivity)
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await fetch(`${apiBase}/health`).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
            const result = await getPortRiskOverview(selectedRegion);
            setRiskOverview(result);
            // Also populate vessel data from the overview for map/table
            setData({
                region: result.region,
                port_name: result.port_name,
                bounding_box: result.bounding_box,
                center: result.center,
                vessel_count: result.vessel_count,
                avg_speed: result.avg_speed,
                stationary_count: result.stationary_count,
                moving_count: result.moving_count,
                moored_count: result.moored_count,
                congestion_level: result.congestion_level,
                messages_received: 0,
                vessels: result.vessels,
            });
            setLastFetched(new Date().toLocaleTimeString());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch risk overview');
        } finally {
            setLoadingRisk(false);
        }
    }, [selectedRegion]);

    const isAnyLoading = loading || loadingRisk;

    return (
        <div className="min-h-screen relative">
            <BackgroundEffects riskLevel={null} />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
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
                                    <Radar className="w-6 h-6 text-cyber-blue relative z-10" />
                                </motion.div>

                                <div>
                                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wider">
                                        <span className="text-white">PORT</span>
                                        <span className="text-cyber-blue"> MONITOR</span>
                                    </h1>
                                    <p className="text-sm text-slate-400 font-mono tracking-wide">
                                        LIVE VESSEL TRACKING • AISSTREAM.IO
                                    </p>
                                </div>
                            </div>

                            {/* Navigation & Status */}
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Risk Dashboard
                                </Link>

                                {isAnyLoading && (
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            className="w-2 h-2 rounded-full bg-cyan-500"
                                            animate={{ opacity: [1, 0.3, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        />
                                        <span className="text-xs font-mono text-cyan-400 tracking-wider">
                                            {loadingRisk ? 'ANALYZING...' : 'SCANNING...'}
                                        </span>
                                    </div>
                                )}

                                {lastFetched && !isAnyLoading && (
                                    <span className="text-xs font-mono text-slate-500">
                                        Updated: {lastFetched}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-6 mb-8"
                >
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                                Select Port Region
                            </label>
                            <select
                                className="select-cyber w-full"
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                disabled={isAnyLoading}
                            >
                                {regions.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn-primary flex items-center gap-3"
                            onClick={fetchVessels}
                            disabled={isAnyLoading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" />
                                    <span>Scanning...</span>
                                </>
                            ) : (
                                <>
                                    <Radar className="w-4 h-4" />
                                    <span>Scan Port</span>
                                </>
                            )}
                        </button>

                        <button
                            className="btn-primary flex items-center gap-3"
                            onClick={fetchRiskOverview}
                            disabled={isAnyLoading}
                            style={{
                                background: loadingRisk ? undefined : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.2))',
                                borderColor: 'rgba(139, 92, 246, 0.4)',
                            }}
                        >
                            {loadingRisk ? (
                                <>
                                    <div className="spinner" />
                                    <span>Analyzing Risk...</span>
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Full Risk Overview</span>
                                </>
                            )}
                        </button>

                        {data && !isAnyLoading && (
                            <button
                                className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors px-4 py-3 rounded-lg border border-white/10 hover:border-cyan-500/30"
                                onClick={riskOverview ? fetchRiskOverview : fetchVessels}
                            >
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                            </button>
                        )}
                    </div>

                    {/* Loading messages */}
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 flex items-center gap-3 text-cyan-400 bg-cyan-500/5 px-4 py-3 rounded-lg border border-cyan-500/15"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <Radar className="w-4 h-4" />
                            </motion.div>
                            <span className="text-sm">
                                Scanning AIS stream for <strong>{selectedRegion}</strong>... This takes ~30 seconds.
                            </span>
                        </motion.div>
                    )}

                    {loadingRisk && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 flex items-center gap-3 text-violet-400 bg-violet-500/5 px-4 py-3 rounded-lg border border-violet-500/15"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <Shield className="w-4 h-4" />
                            </motion.div>
                            <span className="text-sm">
                                Running full supply chain analysis for <strong>{selectedRegion}</strong>... Gathering news, weather, port data + AIS scan (~30-45 seconds).
                            </span>
                        </motion.div>
                    )}

                    {/* Error */}
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

                {/* Content */}
                {!data && !isAnyLoading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card rounded-2xl p-16 text-center"
                    >
                        <motion.div
                            className="w-24 h-24 mx-auto mb-6 rounded-full border border-cyan-500/20 flex items-center justify-center relative"
                        >
                            <div className="absolute inset-0 rounded-full border border-cyan-500/10" />
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.15) 60deg, transparent 120deg)',
                                }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                            />
                            <Radar className="w-10 h-10 text-cyan-500/40 relative z-10" />
                        </motion.div>
                        <h3 className="font-display text-lg font-bold text-white mb-2 tracking-wide">
                            PORT VESSEL SCANNER
                        </h3>
                        <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                            Select a port region and click <strong>Scan Port</strong> to detect real-time vessel positions,
                            or click <strong>Full Risk Overview</strong> to get a complete supply chain risk assessment
                            including news, weather, port congestion, and an AI-generated analysis.
                        </p>
                    </motion.div>
                ) : data ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                        key={lastFetched}
                    >
                        {/* Risk Overview (when available) */}
                        {riskOverview && (
                            <RiskOverviewPanel data={riskOverview} />
                        )}

                        {/* Stats Cards (only show if risk overview not present — it has its own risk cards) */}
                        {!riskOverview && (
                            <PortStatsCards data={data} />
                        )}

                        {/* Map */}
                        {data.vessels.length > 0 && (
                            <VesselMap
                                vessels={data.vessels}
                                center={data.center}
                                boundingBox={data.bounding_box}
                                portName={data.port_name}
                            />
                        )}

                        {/* Vessel Table */}
                        <VesselTable vessels={data.vessels} />
                    </motion.div>
                ) : null}
            </div>
        </div>
    );
}
