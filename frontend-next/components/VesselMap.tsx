'use client';

import { useEffect, useRef, useMemo } from 'react';
import { VesselData } from '@/lib/types';

// We need to dynamically import leaflet because it uses window
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface VesselMapProps {
    vessels: VesselData[];
    center: { lat: number; lon: number };
    boundingBox: number[][];
    portName: string;
}

function getStatusColor(navStatus?: number): string {
    switch (navStatus) {
        case 0: return '#10b981'; // Under way - green
        case 1: return '#f59e0b'; // At anchor - yellow
        case 5: return '#ef4444'; // Moored - red
        case 2: return '#8b5cf6'; // Not under command - purple
        case 3: return '#6366f1'; // Restricted maneuverability - indigo
        case 7: return '#14b8a6'; // Fishing - teal
        case 8: return '#22c55e'; // Sailing - light green
        default: return '#64748b'; // Unknown - gray
    }
}

function getStatusLabel(navStatus?: number): string {
    switch (navStatus) {
        case 0: return 'Under Way';
        case 1: return 'At Anchor';
        case 2: return 'Not Under Command';
        case 3: return 'Restricted';
        case 5: return 'Moored';
        case 7: return 'Fishing';
        case 8: return 'Sailing';
        default: return 'Unknown';
    }
}

export function VesselMap({ vessels, center, boundingBox, portName }: VesselMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [center.lat, center.lon],
            zoom: 11,
            zoomControl: true,
            attributionControl: true,
        });

        // Dark theme tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Add bounding box rectangle
        if (boundingBox && boundingBox.length === 2) {
            L.rectangle(
                [[boundingBox[0][0], boundingBox[0][1]], [boundingBox[1][0], boundingBox[1][1]]],
                {
                    color: '#06b6d4',
                    weight: 1,
                    fillColor: '#06b6d4',
                    fillOpacity: 0.05,
                    dashArray: '5, 10',
                }
            ).addTo(map);
        }

        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when vessels change
    useEffect(() => {
        if (!markersRef.current || !mapRef.current) return;

        markersRef.current.clearLayers();

        vessels.forEach((vessel) => {
            if (vessel.latitude == null || vessel.longitude == null) return;

            const color = getStatusColor(vessel.nav_status);
            const statusLabel = getStatusLabel(vessel.nav_status);

            const marker = L.circleMarker([vessel.latitude, vessel.longitude], {
                radius: 6,
                fillColor: color,
                color: color,
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.7,
            });

            const popupContent = `
        <div style="font-family: 'Outfit', sans-serif; color: #e2e8f0; min-width: 200px;">
          <div style="font-size: 14px; font-weight: 600; color: white; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            ${vessel.name || 'Unknown Vessel'}
          </div>
          <div style="display: grid; gap: 4px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">MMSI</span>
              <span style="font-family: 'JetBrains Mono', monospace;">${vessel.mmsi}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Status</span>
              <span style="color: ${color}; font-weight: 600;">${statusLabel}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Speed</span>
              <span>${vessel.sog?.toFixed(1) ?? 'N/A'} kn</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Course</span>
              <span>${vessel.cog?.toFixed(0) ?? 'N/A'}°</span>
            </div>
            ${vessel.ship_type_text ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Type</span>
              <span>${vessel.ship_type_text}</span>
            </div>` : ''}
            ${vessel.destination && vessel.destination !== 'N/A' ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Dest</span>
              <span>${vessel.destination}</span>
            </div>` : ''}
          </div>
        </div>
      `;

            marker.bindPopup(popupContent, {
                className: 'vessel-popup',
                closeButton: true,
                maxWidth: 250,
            });

            markersRef.current?.addLayer(marker);
        });
    }, [vessels]);

    // Legend data
    const legendItems = useMemo(() => [
        { color: '#10b981', label: 'Under Way' },
        { color: '#f59e0b', label: 'At Anchor' },
        { color: '#ef4444', label: 'Moored' },
        { color: '#64748b', label: 'Other' },
    ], []);

    return (
        <div className="glass-card rounded-2xl overflow-hidden relative">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                        <span className="text-cyan-400 text-sm">🗺️</span>
                    </div>
                    <div>
                        <h3 className="font-display text-sm font-semibold tracking-wide text-white">
                            VESSEL MAP
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">{portName}</p>
                    </div>
                </div>
                <span className="text-xs font-mono text-slate-400">
                    {vessels.length} vessels tracked
                </span>
            </div>

            {/* Map container */}
            <div ref={containerRef} className="vessel-map-container" style={{ height: '450px', width: '100%' }} />

            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] glass-card rounded-lg p-3">
                <div className="flex flex-wrap gap-3">
                    {legendItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }}
                            />
                            <span className="text-xs text-slate-400 font-mono">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
