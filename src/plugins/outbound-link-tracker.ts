import { GA4Plugin, SendFunction, OutboundLinkTrackerOptions } from '../types/plugins';
import { delegate, DelegateHandle } from '../helpers/delegate';
import { parseUrl } from '../helpers/parse-url';

function defaultShouldTrack(link: Element, parseUrlFn: (url: string) => { hostname: string; protocol: string; href: string }): boolean {
    const href = link.getAttribute('href') || link.getAttribute('xlink:href');
    if (!href) return false;
    const url = parseUrlFn(href);
    return url.hostname !== location.hostname && url.protocol.startsWith('http');
}

/**
 * Automatically tracks clicks on outbound links (links to external domains).
 *
 * Sends an event when a user clicks a link whose hostname differs
 * from the current page's hostname.
 */
export class OutboundLinkTracker implements GA4Plugin {
    private delegates: DelegateHandle[] = [];
    private send: SendFunction;
    private events: string[];
    private linkSelector: string;
    private eventName: string;
    private shouldTrackOutboundLink: NonNullable<OutboundLinkTrackerOptions['shouldTrackOutboundLink']>;
    private hitFilter?: OutboundLinkTrackerOptions['hitFilter'];

    constructor(send: SendFunction, options?: OutboundLinkTrackerOptions) {
        this.send = send;
        this.events = options?.events ?? ['click'];
        this.linkSelector = options?.linkSelector ?? 'a, area';
        this.eventName = options?.eventName ?? 'outbound_link_click';
        this.shouldTrackOutboundLink = options?.shouldTrackOutboundLink ?? defaultShouldTrack;
        this.hitFilter = options?.hitFilter;

        this.events.forEach((eventType) => {
            const handle = delegate(
                document,
                eventType,
                this.linkSelector,
                (event, element) => this.handleLinkInteraction(event, element),
                { composed: true, useCapture: true }
            );
            this.delegates.push(handle);
        });
    }

    private handleLinkInteraction(event: Event, element: Element): void {
        if (!this.shouldTrackOutboundLink(element, parseUrl)) return;

        const href = element.getAttribute('href') || element.getAttribute('xlink:href') || '';
        const url = parseUrl(href);

        let params: Record<string, unknown> = {
            link_url: url.href,
            link_domain: url.hostname,
            outbound: true,
        };

        if (this.hitFilter) {
            const filtered = this.hitFilter(params, element, event);
            if (filtered === null) return;
            params = filtered;
        }

        this.send(this.eventName, params);
    }

    remove(): void {
        this.delegates.forEach((d) => d.destroy());
        this.delegates = [];
    }
}
