import { GA4Plugin, SendFunction, CleanUrlTrackerOptions } from '../types/plugins';

/**
 * Normalizes URLs before they are sent with `page_view` events.
 *
 * Intercepts `gtag()` calls for `config` and `page_view` events
 * and cleans the `page_location` and `page_path` parameters
 * (strip query params, normalize trailing slashes, apply custom filters).
 */
export class CleanUrlTracker implements GA4Plugin {
    private opts: CleanUrlTrackerOptions;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    private originalGtag: Function | null = null;

    constructor(_send: SendFunction, options?: CleanUrlTrackerOptions) {
        this.opts = {
            stripQuery: options?.stripQuery ?? false,
            queryParamsAllowlist: options?.queryParamsAllowlist,
            queryParamsDenylist: options?.queryParamsDenylist,
            trailingSlash: options?.trailingSlash,
            urlFilter: options?.urlFilter,
        };

        if (typeof window !== 'undefined' && window.gtag) {
            this.originalGtag = window.gtag;
            const self = this;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).gtag = function () {
                // eslint-disable-next-line prefer-rest-params
                const args = Array.prototype.slice.call(arguments);

                if (args.length >= 3 && typeof args[2] === 'object' && args[2] !== null) {
                    const isPageView = args[0] === 'event' && args[1] === 'page_view';
                    const isConfig = args[0] === 'config';

                    if (isPageView || isConfig) {
                        args[2] = self.cleanParams({ ...args[2] });
                    }
                }

                return self.originalGtag!.apply(window, args);
            };
        }
    }

    private cleanParams(params: Record<string, unknown>): Record<string, unknown> {
        if (typeof params.page_location === 'string') {
            params.page_location = this.cleanUrl(params.page_location);
        }
        if (typeof params.page_path === 'string') {
            params.page_path = this.cleanPath(params.page_path);
        }
        return params;
    }

    cleanUrl(url: string): string {
        try {
            const u = new URL(url);
            u.pathname = this.cleanPath(u.pathname);

            if (this.opts.stripQuery) {
                if (this.opts.queryParamsAllowlist && this.opts.queryParamsAllowlist.length > 0) {
                    const allowed = new URLSearchParams();
                    this.opts.queryParamsAllowlist.forEach((param) => {
                        if (u.searchParams.has(param)) {
                            allowed.set(param, u.searchParams.get(param)!);
                        }
                    });
                    u.search = allowed.toString() ? '?' + allowed.toString() : '';
                } else {
                    u.search = '';
                }
            } else if (this.opts.queryParamsDenylist && this.opts.queryParamsDenylist.length > 0) {
                this.opts.queryParamsDenylist.forEach((param) => {
                    u.searchParams.delete(param);
                });
                u.search = u.searchParams.toString() ? '?' + u.searchParams.toString() : '';
            }

            let result = u.toString();
            if (this.opts.urlFilter) {
                result = this.opts.urlFilter(result);
            }
            return result;
        } catch {
            return url;
        }
    }

    cleanPath(path: string): string {
        let result = path;

        if (this.opts.trailingSlash === 'remove') {
            result = result.length > 1 ? result.replace(/\/+$/, '') : result;
        } else if (this.opts.trailingSlash === 'add') {
            if (!result.endsWith('/') && !result.split('/').pop()?.includes('.')) {
                result += '/';
            }
        }

        return result;
    }

    remove(): void {
        if (this.originalGtag) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).gtag = this.originalGtag;
            this.originalGtag = null;
        }
    }
}
