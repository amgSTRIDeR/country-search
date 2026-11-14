import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import debounce from './debounce';
import { InvalidArgumentsError } from '../errors/errors';

describe('Debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test.each([
        { desc: 'no arguments passed', args: [] },
        { desc: 'callback is not a function', args: ['not a fn', 100] },
        { desc: 'delay is not a number', args: [() => {}, '100'] },
        { desc: 'delay is negative', args: [() => {}, -50] },
        { desc: 'delay is infinite', args: [() => {}, Infinity] },
        { desc: 'delay is NaN', args: [() => {}, NaN] },
    ])('Should throw InvalidArgumentsError when $desc', ({ args }) => {
        // @ts-expect-error — intentionally passing an invalid argument type
        expect(() => debounce(...args)).toThrow(InvalidArgumentsError);
    });

    test('should call callback after specified delay', () => {
        const callback = vi.fn();
        const debouncer = debounce(callback, 1000);

        debouncer();

        vi.advanceTimersByTime(500);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should reset the delay and use the latest arguments', () => {
        const callback = vi.fn<(value: string) => void>();
        const debouncer = debounce(callback, 1000);

        debouncer('first');
        vi.advanceTimersByTime(700);
        debouncer('latest');

        vi.advanceTimersByTime(999);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('latest');
    });

    test('should not call callback if cancelled', () => {
        const callback = vi.fn();
        const debouncer = debounce(callback, 1000);

        debouncer();

        vi.advanceTimersByTime(500);
        expect(callback).not.toHaveBeenCalled();

        debouncer.cancel();

        vi.advanceTimersByTime(500);
        expect(callback).not.toHaveBeenCalled();
    });

    test('should be callable again after cancellation', () => {
        const callback = vi.fn();
        const debouncer = debounce(callback, 1000);

        debouncer();
        debouncer.cancel();
        vi.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();

        debouncer();
        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(1);
    });
});
