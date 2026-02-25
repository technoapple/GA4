export interface ParsedUrl {
    href: string;
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    origin: string;
}

export function parseUrl(url: string): ParsedUrl {
    try {
        const parsed = new URL(url, location.href);
        return {
            href: parsed.href,
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port,
            pathname: parsed.pathname,
            search: parsed.search,
            hash: parsed.hash,
            origin: parsed.origin,
        };
    } catch {
        return {
            href: url,
            protocol: '',
            hostname: '',
            port: '',
            pathname: url,
            search: '',
            hash: '',
            origin: '',
        };
    }
}
