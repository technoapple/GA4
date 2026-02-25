export interface DebouncedFunction<T extends (...args: never[]) => void> {
    (...args: Parameters<T>): void;
    cancel(): void;
}

export function debounce<T extends (...args: never[]) => void>(
    fn: T,
    delay: number
): DebouncedFunction<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const debounced = function (this: unknown, ...args: Parameters<T>) {
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn.apply(this, args);
        }, delay);
    } as DebouncedFunction<T>;

    debounced.cancel = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };

    return debounced;
}
