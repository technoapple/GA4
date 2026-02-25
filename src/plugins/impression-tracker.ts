import { GA4Plugin, SendFunction, ImpressionTrackerOptions, ImpressionElementConfig } from '../types/plugins';
import { domReady } from '../helpers/dom-ready';

interface NormalizedItem {
    id: string;
    threshold: number;
    trackFirstImpressionOnly: boolean;
}

/**
 * Tracks when specific DOM elements become visible in the viewport
 * using `IntersectionObserver`.
 *
 * Useful for tracking ad impressions, CTA visibility, or any
 * element that enters the user's viewport.
 */
export class ImpressionTracker implements GA4Plugin {
    private send: SendFunction;
    private rootMargin: string;
    private attributePrefix: string;
    private eventName: string;
    private hitFilter?: ImpressionTrackerOptions['hitFilter'];
    private items: NormalizedItem[] = [];
    private elementMap: Record<string, Element | null> = {};
    private thresholdMap: Record<number, IntersectionObserver> = {};
    private mutationObserver: MutationObserver | null = null;
    private impressedIds: Set<string> = new Set();
    private supported: boolean;

    constructor(send: SendFunction, options?: ImpressionTrackerOptions) {
        this.supported =
            typeof IntersectionObserver !== 'undefined' &&
            typeof MutationObserver !== 'undefined';

        this.send = send;
        this.rootMargin = options?.rootMargin ?? '0px';
        this.attributePrefix = options?.attributePrefix ?? 'data-ga4-';
        this.eventName = options?.eventName ?? 'element_impression';
        this.hitFilter = options?.hitFilter;

        if (!this.supported) return;

        this.handleIntersectionChanges = this.handleIntersectionChanges.bind(this);
        this.handleDomMutations = this.handleDomMutations.bind(this);

        const elements = options?.elements;
        domReady(() => {
            if (elements && elements.length > 0) {
                this.observeElements(elements);
            }
        });
    }

    observeElements(elements: Array<string | ImpressionElementConfig>): void {
        if (!this.supported) return;

        const newItems = this.normalizeElements(elements);
        this.items = this.items.concat(newItems);

        newItems.forEach((item) => {
            const observer = this.getObserverForThreshold(item.threshold);
            const element = document.getElementById(item.id);
            this.elementMap[item.id] = element;
            if (element) {
                observer.observe(element);
            }
        });

        if (!this.mutationObserver && document.body) {
            this.mutationObserver = new MutationObserver(this.handleDomMutations);
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }
    }

    unobserveElements(elements: Array<string | ImpressionElementConfig>): void {
        if (!this.supported) return;

        const idsToRemove = new Set(
            elements.map((el) => (typeof el === 'string' ? el : el.id))
        );

        this.items = this.items.filter((item) => {
            if (idsToRemove.has(item.id)) {
                const element = this.elementMap[item.id];
                if (element && this.thresholdMap[item.threshold]) {
                    this.thresholdMap[item.threshold].unobserve(element);
                }
                delete this.elementMap[item.id];
                return false;
            }
            return true;
        });

        if (this.items.length === 0) {
            this.disconnectAll();
        }
    }

    unobserveAllElements(): void {
        this.disconnectAll();
        this.items = [];
        this.elementMap = {};
    }

    private normalizeElements(elements: Array<string | ImpressionElementConfig>): NormalizedItem[] {
        return elements.map((el) => {
            if (typeof el === 'string') {
                return { id: el, threshold: 0, trackFirstImpressionOnly: true };
            }
            return {
                id: el.id,
                threshold: el.threshold ?? 0,
                trackFirstImpressionOnly: el.trackFirstImpressionOnly ?? true,
            };
        });
    }

    private getObserverForThreshold(threshold: number): IntersectionObserver {
        if (!this.thresholdMap[threshold]) {
            this.thresholdMap[threshold] = new IntersectionObserver(
                this.handleIntersectionChanges,
                {
                    rootMargin: this.rootMargin,
                    threshold: [threshold],
                }
            );
        }
        return this.thresholdMap[threshold];
    }

    private handleIntersectionChanges(entries: IntersectionObserverEntry[]): void {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const id = entry.target.id;
            if (!id) return;

            const item = this.items.find((i) => i.id === id);
            if (!item) return;
            if (item.trackFirstImpressionOnly && this.impressedIds.has(id)) return;

            this.impressedIds.add(id);

            const prefix = this.attributePrefix;
            const attrParams: Record<string, unknown> = {};
            for (let i = 0; i < entry.target.attributes.length; i++) {
                const attr = entry.target.attributes[i];
                if (attr.name.startsWith(prefix)) {
                    const key = attr.name.slice(prefix.length).replace(/-/g, '_');
                    attrParams[key] = attr.value;
                }
            }

            let params: Record<string, unknown> = {
                element_id: id,
                ...attrParams,
            };

            if (this.hitFilter) {
                const filtered = this.hitFilter(params, entry.target);
                if (filtered === null) return;
                params = filtered;
            }

            this.send(this.eventName, params);

            if (item.trackFirstImpressionOnly && this.thresholdMap[item.threshold]) {
                this.thresholdMap[item.threshold].unobserve(entry.target);
            }
        });
    }

    private handleDomMutations(mutations: MutationRecord[]): void {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                this.walkNodeTree(node as Element, (id) => {
                    const element = document.getElementById(id);
                    if (element) {
                        this.elementMap[id] = element;
                        const item = this.items.find((i) => i.id === id);
                        if (item && this.thresholdMap[item.threshold]) {
                            this.thresholdMap[item.threshold].observe(element);
                        }
                    }
                });
            });

            mutation.removedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                this.walkNodeTree(node as Element, (id) => {
                    const element = this.elementMap[id];
                    if (element) {
                        const item = this.items.find((i) => i.id === id);
                        if (item && this.thresholdMap[item.threshold]) {
                            this.thresholdMap[item.threshold].unobserve(element);
                        }
                    }
                    this.elementMap[id] = null;
                });
            });
        });
    }

    private walkNodeTree(node: Element, callback: (id: string) => void): void {
        if (node.id && node.id in this.elementMap) {
            callback(node.id);
        }
        for (let i = 0; i < node.children.length; i++) {
            this.walkNodeTree(node.children[i], callback);
        }
    }

    private disconnectAll(): void {
        Object.values(this.thresholdMap).forEach((observer) => observer.disconnect());
        this.thresholdMap = {};
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }

    remove(): void {
        this.unobserveAllElements();
        this.impressedIds.clear();
    }
}
