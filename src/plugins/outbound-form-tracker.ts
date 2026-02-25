import { GA4Plugin, SendFunction, OutboundFormTrackerOptions } from '../types/plugins';
import { delegate, DelegateHandle } from '../helpers/delegate';
import { parseUrl } from '../helpers/parse-url';

function defaultShouldTrack(form: HTMLFormElement, parseUrlFn: (url: string) => { hostname: string; protocol: string; href: string }): boolean {
    const action = form.action;
    if (!action) return false;
    const url = parseUrlFn(action);
    return url.hostname !== location.hostname && url.protocol.startsWith('http');
}

/**
 * Automatically tracks form submissions to external domains.
 *
 * Sends an event when a form's `action` attribute points to a
 * different hostname than the current page.
 */
export class OutboundFormTracker implements GA4Plugin {
    private delegateHandle: DelegateHandle;
    private send: SendFunction;
    private eventName: string;
    private shouldTrackOutboundForm: NonNullable<OutboundFormTrackerOptions['shouldTrackOutboundForm']>;
    private hitFilter?: OutboundFormTrackerOptions['hitFilter'];

    constructor(send: SendFunction, options?: OutboundFormTrackerOptions) {
        this.send = send;
        this.eventName = options?.eventName ?? 'outbound_form_submit';
        this.shouldTrackOutboundForm = options?.shouldTrackOutboundForm ?? defaultShouldTrack;
        this.hitFilter = options?.hitFilter;

        const formSelector = options?.formSelector ?? 'form';

        this.delegateHandle = delegate(
            document,
            'submit',
            formSelector,
            (event, element) => this.handleFormSubmit(event, element as HTMLFormElement),
            { composed: true, useCapture: true }
        );
    }

    private handleFormSubmit(event: Event, form: HTMLFormElement): void {
        if (!this.shouldTrackOutboundForm(form, parseUrl)) return;

        const url = parseUrl(form.action);

        let params: Record<string, unknown> = {
            form_action: url.href,
            form_domain: url.hostname,
            outbound: true,
        };

        if (this.hitFilter) {
            const filtered = this.hitFilter(params, form, event);
            if (filtered === null) return;
            params = filtered;
        }

        this.send(this.eventName, params);
    }

    remove(): void {
        this.delegateHandle.destroy();
    }
}
