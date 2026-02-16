'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Filter, Ship, Navigation, Anchor, MapPin } from 'lucide-react';
import { VesselData } from '@/lib/types';

interface VesselTableProps {
    vessels: VesselData[];
}

type SortField = 'name' | 'sog' | 'nav_status' | 'ship_type_text' | 'destination';
type SortDirection = 'asc' | 'desc';

function getStatusColor(navStatus?: number): string {
    switch (navStatus) {
        case 0: return '#10b981';
        case 1: return '#f59e0b';
        case 5: return '#ef4444';
        default: return '#64748b';
    }
}

function getStatusDot(navStatus?: number) {
    const color = getStatusColor(navStatus);
    return (
        <span
            className="inline-block w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
        />
    );
}

export function VesselTable({ vessels }: VesselTableProps) {
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDir, setSortDir] = useState<SortDirection>('asc');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const filteredAndSorted = useMemo(() => {
        let filtered = vessels;

        if (statusFilter !== 'all') {
            const statusNum = parseInt(statusFilter);
            filtered = vessels.filter(v => v.nav_status === statusNum);
        }

        return [...filtered].sort((a, b) => {
            let aVal: string | number = '';
            let bVal: string | number = '';

            switch (sortField) {
                case 'name':
                    aVal = (a.name || 'Unknown').toLowerCase();
                    bVal = (b.name || 'Unknown').toLowerCase();
                    break;
                case 'sog':
                    aVal = a.sog ?? 0;
                    bVal = b.sog ?? 0;
                    break;
                case 'nav_status':
                    aVal = a.nav_status_text || '';
                    bVal = b.nav_status_text || '';
                    break;
                case 'ship_type_text':
                    aVal = a.ship_type_text || '';
                    bVal = b.ship_type_text || '';
                    break;
                case 'destination':
                    aVal = a.destination || '';
                    bVal = b.destination || '';
                    break;
            }

            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [vessels, sortField, sortDir, statusFilter]);

    const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <th
            className="vessel-table-th cursor-pointer select-none group"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                <ArrowUpDown className={`w-3 h-3 transition-colors ${sortField === field ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'
                    }`} />
            </div>
        </th>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                        <Ship className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-display text-sm font-semibold tracking-wide text-white">
                            VESSEL ACTIVITY
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                            {filteredAndSorted.length} of {vessels.length} vessels
                        </p>
                    </div>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3 text-slate-500" />
                    <select
                        className="select-cyber text-xs py-1.5 px-3"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="0">Under Way</option>
                        <option value="1">At Anchor</option>
                        <option value="5">Moored</option>
                        <option value="7">Fishing</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto vessel-table-wrapper">
                <table className="vessel-table">
                    <thead>
                        <tr>
                            <SortHeader field="name">Vessel Name</SortHeader>
                            <th className="vessel-table-th">MMSI</th>
                            <SortHeader field="sog">Speed</SortHeader>
                            <th className="vessel-table-th">Course</th>
                            <SortHeader field="nav_status">Status</SortHeader>
                            <SortHeader field="ship_type_text">Type</SortHeader>
                            <SortHeader field="destination">Destination</SortHeader>
                            <th className="vessel-table-th">Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSorted.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-12 text-slate-500 text-sm">
                                    No vessels found matching filter
                                </td>
                            </tr>
                        ) : (
                            filteredAndSorted.map((vessel, index) => (
                                <motion.tr
                                    key={vessel.mmsi}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                                    className="vessel-table-row"
                                >
                                    <td className="vessel-table-td">
                                        <div className="flex items-center gap-2">
                                            <Navigation
                                                className="w-3.5 h-3.5 flex-shrink-0"
                                                style={{
                                                    color: getStatusColor(vessel.nav_status),
                                                    transform: `rotate(${vessel.cog ?? 0}deg)`,
                                                }}
                                            />
                                            <span className="font-medium text-white truncate max-w-[140px]">
                                                {vessel.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="vessel-table-td font-mono text-slate-400">
                                        {vessel.mmsi}
                                    </td>
                                    <td className="vessel-table-td font-mono">
                                        <span className={vessel.sog && vessel.sog > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                                            {vessel.sog?.toFixed(1) ?? '0.0'} kn
                                        </span>
                                    </td>
                                    <td className="vessel-table-td font-mono text-slate-400">
                                        {vessel.cog?.toFixed(0) ?? 'N/A'}°
                                    </td>
                                    <td className="vessel-table-td">
                                        <span className="flex items-center">
                                            {getStatusDot(vessel.nav_status)}
                                            <span className="text-xs" style={{ color: getStatusColor(vessel.nav_status) }}>
                                                {vessel.nav_status_text || 'Unknown'}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="vessel-table-td text-xs text-slate-400">
                                        {vessel.ship_type_text || '-'}
                                    </td>
                                    <td className="vessel-table-td">
                                        {vessel.destination && vessel.destination !== 'N/A' ? (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                <span className="text-xs text-slate-300 truncate max-w-[100px]">
                                                    {vessel.destination}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600">-</span>
                                        )}
                                    </td>
                                    <td className="vessel-table-td text-xs text-slate-400 font-mono">
                                        {vessel.length && vessel.length > 0
                                            ? `${vessel.length}×${vessel.width}m`
                                            : '-'}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
