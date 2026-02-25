export type SendFunction = (eventName: string, params: Record<string, unknown>) => void;

export interface GA4Plugin {
    remove(): void;
}

// --- Event Tracker ---

export interface EventTrackerOptions {
    events?: string[];
    attributePrefix?: string;
    hitFilter?: (params: Record<string, unknown>, element: Element, event: Event) => Record<string, unknown> | null;
}

// --- Outbound Link Tracker ---

export interface OutboundLinkTrackerOptions {
    events?: string[];
    linkSelector?: string;
    shouldTrackOutboundLink?: (link: Element, parseUrl: (url: string) => { hostname: string; protocol: string; href: string }) => boolean;
    eventName?: string;
    attributePrefix?: string;
    hitFilter?: (params: Record<string, unknown>, element: Element, event: Event) => Record<string, unknown> | null;
}

// --- Outbound Form Tracker ---

export interface OutboundFormTrackerOptions {
    formSelector?: string;
    shouldTrackOutboundForm?: (form: HTMLFormElement, parseUrl: (url: string) => { hostname: string; protocol: string; href: string }) => boolean;
    eventName?: string;
    hitFilter?: (params: Record<string, unknown>, element: Element, event: Event) => Record<string, unknown> | null;
}

// --- Page Visibility Tracker ---

export interface PageVisibilityTrackerOptions {
    sendInitialPageview?: boolean;
    sessionTimeout?: number;
    timeZone?: string;
    eventName?: string;
    hitFilter?: (params: Record<string, unknown>) => Record<string, unknown> | null;
}

// --- URL Change Tracker ---

export interface UrlChangeTrackerOptions {
    shouldTrackUrlChange?: (newPath: string, oldPath: string) => boolean;
    trackReplaceState?: boolean;
    hitFilter?: (params: Record<string, unknown>) => Record<string, unknown> | null;
}

// --- Impression Tracker ---

export interface ImpressionElementConfig {
    id: string;
    threshold?: number;
    trackFirstImpressionOnly?: boolean;
}

export interface ImpressionTrackerOptions {
    elements?: Array<string | ImpressionElementConfig>;
    rootMargin?: string;
    attributePrefix?: string;
    eventName?: string;
    hitFilter?: (params: Record<string, unknown>, element: Element) => Record<string, unknown> | null;
}

// --- Clean URL Tracker ---

export interface CleanUrlTrackerOptions {
    stripQuery?: boolean;
    queryParamsAllowlist?: string[];
    queryParamsDenylist?: string[];
    trailingSlash?: 'add' | 'remove';
    urlFilter?: (url: string) => string;
}

// --- Media Query Tracker ---

export interface MediaQueryDefinitionItem {
    name: string;
    media: string;
}

export interface MediaQueryDefinition {
    name: string;
    dimensionIndex?: number;
    items: MediaQueryDefinitionItem[];
}

export interface MediaQueryTrackerOptions {
    definitions?: MediaQueryDefinition[];
    changeTemplate?: (oldValue: string, newValue: string) => string;
    changeTimeout?: number;
    eventName?: string;
    hitFilter?: (params: Record<string, unknown>) => Record<string, unknown> | null;
}
