import { SystemState, ChatResponse, PortMonitorData, PortStatsData, RiskOverviewData } from './types';

const API_BASE_Url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getRegions(): Promise<string[]> {
    const res = await fetch(`${API_BASE_Url}/regions`);
    if (!res.ok) throw new Error('Failed to fetch regions');
    const data = await res.json();
    return data.regions;
}

export async function analyzeRegion(region: string): Promise<SystemState> {
    const res = await fetch(`${API_BASE_Url}/analyze/${region}`, {
        method: 'POST',
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis failed');
    }
    return res.json();
}

export async function getCurrentState(): Promise<SystemState | null> {
    const res = await fetch(`${API_BASE_Url}/state`);
    if (!res.ok) return null;
    return res.json();
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE_Url}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
}

// Port Monitor API functions
export async function getPortVessels(region: string): Promise<PortMonitorData> {
    const res = await fetch(`${API_BASE_Url}/port/vessels/${encodeURIComponent(region)}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch vessel data');
    }
    return res.json();
}

export async function getPortStats(region: string): Promise<PortStatsData> {
    const res = await fetch(`${API_BASE_Url}/port/stats/${encodeURIComponent(region)}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch port stats');
    }
    return res.json();
}

export async function getPortRiskOverview(region: string): Promise<RiskOverviewData> {
    const res = await fetch(`${API_BASE_Url}/port/risk-overview/${encodeURIComponent(region)}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch risk overview');
    }
    return res.json();
}
