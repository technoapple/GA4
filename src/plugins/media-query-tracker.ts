import { GA4Plugin, SendFunction, MediaQueryTrackerOptions, MediaQueryDefinition } from '../types/plugins';
import { debounce, DebouncedFunction } from '../helpers/debounce';

interface TrackedQuery {
    definition: MediaQueryDefinition;
    mql: MediaQueryList;
    currentValue: string;
    listener: ((event: MediaQueryListEvent) => void);
}

function getMatchingValue(definition: MediaQueryDefinition): string {
    for (const item of definition.items) {
        if (window.matchMedia(item.media).matches) {
            return item.name;
        }
    }
    return '(not set)';
}

/**
 * Tracks CSS media query breakpoint matching and changes.
 *
 * Fires an event whenever the active breakpoint changes
 * (e.g. from "mobile" to "desktop"), debounced to avoid
 * rapid-fire events during window resizing.
 */
export class MediaQueryTracker implements GA4Plugin {
    private send: SendFunction;
    private changeTimeout: number;
    private eventName: string;
    private changeTemplate?: MediaQueryTrackerOptions['changeTemplate'];
    private hitFilter?: MediaQueryTrackerOptions['hitFilter'];
    private trackedQueries: TrackedQuery[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private debouncedHandlers: DebouncedFunction<any>[] = [];

    constructor(send: SendFunction, options?: MediaQueryTrackerOptions) {
        this.send = send;
        this.changeTimeout = options?.changeTimeout ?? 1000;
        this.eventName = options?.eventName ?? 'media_query_change';
        this.changeTemplate = options?.changeTemplate;
        this.hitFilter = options?.hitFilter;

        if (typeof window.matchMedia !== 'function') return;

        const definitions = options?.definitions ?? [];
        definitions.forEach((definition) => {
            this.trackDefinition(definition);
        });
    }

    private trackDefinition(definition: MediaQueryDefinition): void {
        const initialValue = getMatchingValue(definition);

        definition.items.forEach((item) => {
            const mql = window.matchMedia(item.media);

            const debouncedHandler = debounce(() => {
                const newValue = getMatchingValue(definition);
                const tracked = this.trackedQueries.find(
                    (tq) => tq.definition === definition
                );
                if (!tracked || newValue === tracked.currentValue) return;

                const oldValue = tracked.currentValue;
                tracked.currentValue = newValue;

                const changeLabel = this.changeTemplate
                    ? this.changeTemplate(oldValue, newValue)
                    : `${oldValue} => ${newValue}`;

                let params: Record<string, unknown> = {
                    media_query_name: definition.name,
                    media_query_value: newValue,
                    media_query_change: changeLabel,
                };

                if (this.hitFilter) {
                    const filtered = this.hitFilter(params);
                    if (filtered === null) return;
                    params = filtered;
                }

                this.send(this.eventName, params);
            }, this.changeTimeout);

            this.debouncedHandlers.push(debouncedHandler);

            const listener = () => {
                debouncedHandler();
            };

            if (typeof mql.addEventListener === 'function') {
                mql.addEventListener('change', listener);
            }

            this.trackedQueries.push({
                definition,
                mql,
                currentValue: initialValue,
                listener,
            });
        });
    }

    remove(): void {
        this.trackedQueries.forEach(({ mql, listener }) => {
            if (typeof mql.removeEventListener === 'function') {
                mql.removeEventListener('change', listener);
            }
        });
        this.debouncedHandlers.forEach((d) => d.cancel());
        this.trackedQueries = [];
        this.debouncedHandlers = [];
    }
}
