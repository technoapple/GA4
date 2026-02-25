import { GA4Plugin, SendFunction, EventTrackerOptions } from '../types/plugins';
import { delegate, DelegateHandle } from '../helpers/delegate';

function kebabToSnake(str: string): string {
    return str.replace(/-/g, '_');
}

function getAttributeParams(element: Element, prefix: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const reservedSuffixes = ['on', 'event-name'];

    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (!attr.name.startsWith(prefix)) continue;

        const suffix = attr.name.slice(prefix.length);
        if (reservedSuffixes.includes(suffix)) continue;

        params[kebabToSnake(suffix)] = attr.value;
    }

    return params;
}

/**
 * Declarative event tracking via HTML `data-ga4-*` attributes.
 *
 * Listens for DOM events on elements with `data-ga4-on` attributes
 * and sends GA4 events based on attribute values.
 *
 * @example
 * ```html
 * <button
 *   data-ga4-on="click"
 *   data-ga4-event-name="video_play"
 *   data-ga4-video-title="My Video">
 *   Play
 * </button>
 * ```
 */
export class EventTracker implements GA4Plugin {
    private delegates: DelegateHandle[] = [];
    private send: SendFunction;
    private events: string[];
    private attributePrefix: string;
    private hitFilter?: EventTrackerOptions['hitFilter'];

    constructor(send: SendFunction, options?: EventTrackerOptions) {
        this.send = send;
        this.events = options?.events ?? ['click'];
        this.attributePrefix = options?.attributePrefix ?? 'data-ga4-';
        this.hitFilter = options?.hitFilter;

        const selector = `[${this.attributePrefix}on]`;

        this.events.forEach((eventType) => {
            const handle = delegate(
                document,
                eventType,
                selector,
                (event, element) => this.handleEvent(event, element),
                { composed: true, useCapture: true }
            );
            this.delegates.push(handle);
        });
    }

    private handleEvent(event: Event, element: Element): void {
        const prefix = this.attributePrefix;
        const onAttr = element.getAttribute(`${prefix}on`);

        if (onAttr !== event.type) return;

        const eventName = element.getAttribute(`${prefix}event-name`) || event.type;
        let params = getAttributeParams(element, prefix);

        if (this.hitFilter) {
            const filtered = this.hitFilter(params, element, event);
            if (filtered === null) return;
            params = filtered;
        }

        this.send(eventName, params);
    }

    remove(): void {
        this.delegates.forEach((d) => d.destroy());
        this.delegates = [];
    }
}
