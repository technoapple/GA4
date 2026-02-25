const SESSION_KEY_PREFIX = 'ga4_session_';

export function isSessionExpired(key: string, timeoutMinutes: number): boolean {
    try {
        const stored = sessionStorage.getItem(SESSION_KEY_PREFIX + key);
        if (!stored) return true;
        const timestamp = parseInt(stored, 10);
        if (isNaN(timestamp)) return true;
        return (Date.now() - timestamp) > timeoutMinutes * 60 * 1000;
    } catch {
        return true;
    }
}

export function updateSessionTimestamp(key: string): void {
    try {
        sessionStorage.setItem(SESSION_KEY_PREFIX + key, String(Date.now()));
    } catch {
        // sessionStorage may be unavailable or full
    }
}

export function getSessionValue<T>(key: string): T | null {
    try {
        const stored = sessionStorage.getItem(SESSION_KEY_PREFIX + key);
        if (stored === null) return null;
        return JSON.parse(stored) as T;
    } catch {
        return null;
    }
}

export function setSessionValue(key: string, value: unknown): void {
    try {
        sessionStorage.setItem(SESSION_KEY_PREFIX + key, JSON.stringify(value));
    } catch {
        // sessionStorage may be unavailable or full
    }
}
