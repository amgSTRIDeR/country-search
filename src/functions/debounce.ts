import { InvalidArgumentsError } from '../errors/errors';
import type { Debounced } from '../models/models';

export default function debounce<T extends (...args: never[]) => void>(fn: T, delay: number): Debounced<T> {
    if (typeof fn !== 'function' || typeof delay !== 'number' || !Number.isFinite(delay) || delay < 0) {
        throw new InvalidArgumentsError();
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const debounced = (...args: Parameters<T>): void => {
        if (timer !== undefined) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            timer = undefined;
            fn(...args);
        }, delay);
    };

    return Object.assign(debounced, {
        cancel: () => {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
            }
        },
    });
}
