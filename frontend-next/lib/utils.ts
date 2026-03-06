export function getSeverityColor(severity: number): string {
    if (severity >= 4) return '#ef4444'; // Red/High
    if (severity >= 3) return '#f59e0b'; // Yellow/Moderate
    return '#10b981'; // Green/Low
}

export function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
}
