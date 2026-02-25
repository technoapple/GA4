import { GA4Plugin, SendFunction, PageVisibilityTrackerOptions } from '../types/plugins';
import { isSessionExpired, updateSessionTimestamp } from '../helpers/session';

/**
 * Tracks how long a page is in the visible state vs. hidden (background tab).
 *
 * Sends a `page_visibility` event each time the visibility state changes,
 * reporting how long the page was in the previous state.
 * Optionally sends a new `page_view` when the page becomes visible
 * again after the session timeout has elapsed.
 */
export class PageVisibilityTracker implements GA4Plugin {
    private send: SendFunction;
    private sendInitialPageview: boolean;
    private sessionTimeout: number;
    private eventName: string;
    private hitFilter?: PageVisibilityTrackerOptions['hitFilter'];
    private lastChangeTime: number;
    private isVisible: boolean;
    private boundVisibilityChange: () => void;
    private boundBeforeUnload: () => void;

    constructor(send: SendFunction, options?: PageVisibilityTrackerOptions) {
        this.send = send;
        this.sendInitialPageview = options?.sendInitialPageview ?? false;
        this.sessionTimeout = options?.sessionTimeout ?? 30;
        this.eventName = options?.eventName ?? 'page_visibility';
        this.hitFilter = options?.hitFilter;

        this.lastChangeTime = Date.now();
        this.isVisible = document.visibilityState === 'visible';

        this.boundVisibilityChange = this.onVisibilityChange.bind(this);
        this.boundBeforeUnload = this.onBeforeUnload.bind(this);

        document.addEventListener('visibilitychange', this.boundVisibilityChange);
        window.addEventListener('beforeunload', this.boundBeforeUnload);

        updateSessionTimestamp('pageVisibility');

        if (this.sendInitialPageview && this.isVisible) {
            this.send('page_view', {
                page_path: location.pathname,
                page_location: location.href,
                page_title: document.title,
            });
        }
    }

    private onVisibilityChange(): void {
        const now = Date.now();
        const duration = now - this.lastChangeTime;
        const previousState = this.isVisible ? 'visible' : 'hidden';

        let params: Record<string, unknown> = {
            visibility_state: previousState,
            visibility_duration: duration,
            page_path: location.pathname,
        };

        if (this.hitFilter) {
            const filtered = this.hitFilter(params);
            if (filtered === null) {
                this.lastChangeTime = now;
                this.isVisible = document.visibilityState === 'visible';
                return;
            }
            params = filtered;
        }

        this.send(this.eventName, params);

        // If page becomes visible again, check session expiry
        if (document.visibilityState === 'visible' && !this.isVisible) {
            if (isSessionExpired('pageVisibility', this.sessionTimeout)) {
                this.send('page_view', {
                    page_path: location.pathname,
                    page_location: location.href,
                    page_title: document.title,
                });
            }
            updateSessionTimestamp('pageVisibility');
        }

        this.lastChangeTime = now;
        this.isVisible = document.visibilityState === 'visible';
    }

    private onBeforeUnload(): void {
        if (this.isVisible) {
            const duration = Date.now() - this.lastChangeTime;
            this.send(this.eventName, {
                visibility_state: 'visible',
                visibility_duration: duration,
                page_path: location.pathname,
            });
        }
    }

    remove(): void {
        document.removeEventListener('visibilitychange', this.boundVisibilityChange);
        window.removeEventListener('beforeunload', this.boundBeforeUnload);
    }
}
