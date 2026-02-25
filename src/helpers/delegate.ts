export interface DelegateHandle {
    destroy(): void;
}

export interface DelegateOptions {
    composed?: boolean;
    useCapture?: boolean;
}

export function delegate(
    target: EventTarget,
    eventType: string,
    selector: string,
    handler: (event: Event, element: Element) => void,
    options?: DelegateOptions
): DelegateHandle {
    const useCapture = options?.useCapture ?? false;

    const listener = (event: Event) => {
        let element: Element | null = event.target as Element | null;

        // Handle composed events (shadow DOM)
        if (options?.composed && typeof event.composedPath === 'function') {
            const path = event.composedPath();
            for (const node of path) {
                if (node === target) break;
                if (node instanceof Element && node.matches(selector)) {
                    handler(event, node);
                    return;
                }
            }
            return;
        }

        while (element && element !== target) {
            if (element.matches(selector)) {
                handler(event, element);
                return;
            }
            element = element.parentElement;
        }
    };

    target.addEventListener(eventType, listener, useCapture);

    return {
        destroy() {
            target.removeEventListener(eventType, listener, useCapture);
        },
    };
}
