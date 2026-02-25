import { GA4Plugin, SendFunction, UrlChangeTrackerOptions } from '../types/plugins';

/**
 * Automatically tracks URL changes in Single Page Applications.
 *
 * Intercepts `history.pushState()`, optionally `history.replaceState()`,
 * and `popstate` events, sending a `page_view` event for each navigation.
 */
export class UrlChangeTracker implements GA4Plugin {
    private send: SendFunction;
    private trackReplaceState: boolean;
    private shouldTrackUrlChange?: UrlChangeTrackerOptions['shouldTrackUrlChange'];
    private hitFilter?: UrlChangeTrackerOptions['hitFilter'];
    private currentPath: string;
    private originalPushState: History['pushState'];
    private originalReplaceState: History['replaceState'];
    private boundPopState: () => void;

    constructor(send: SendFunction, options?: UrlChangeTrackerOptions) {
        this.send = send;
        this.trackReplaceState = options?.trackReplaceState ?? false;
        this.shouldTrackUrlChange = options?.shouldTrackUrlChange;
        this.hitFilter = options?.hitFilter;

        this.currentPath = location.pathname + location.search;
        this.originalPushState = history.pushState;
        this.originalReplaceState = history.replaceState;
        this.boundPopState = this.onUrlChange.bind(this);

        // Monkey-patch history.pushState
        const self = this;
        history.pushState = function (...args: Parameters<History['pushState']>) {
            self.originalPushState.apply(history, args);
            self.onUrlChange();
        };

        // Optionally monkey-patch history.replaceState
        if (this.trackReplaceState) {
            history.replaceState = function (...args: Parameters<History['replaceState']>) {
                self.originalReplaceState.apply(history, args);
                self.onUrlChange();
            };
        }

        window.addEventListener('popstate', this.boundPopState);
    }

    private onUrlChange(): void {
        // Use setTimeout to ensure the URL has been updated
        setTimeout(() => {
            const newPath = location.pathname + location.search;

            const shouldTrack = this.shouldTrackUrlChange
                ? this.shouldTrackUrlChange(newPath, this.currentPath)
                : newPath !== this.currentPath;

            if (!shouldTrack) return;

            this.currentPath = newPath;

            let params: Record<string, unknown> = {
                page_path: location.pathname,
                page_title: document.title,
                page_location: location.href,
            };

            if (this.hitFilter) {
                const filtered = this.hitFilter(params);
                if (filtered === null) return;
                params = filtered;
            }

            this.send('page_view', params);
        }, 0);
    }

    remove(): void {
        window.removeEventListener('popstate', this.boundPopState);
        history.pushState = this.originalPushState;
        if (this.trackReplaceState) {
            history.replaceState = this.originalReplaceState;
        }
    }
}
