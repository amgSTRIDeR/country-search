import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { InvalidArgumentsError } from '../errors/errors';
import { searchCountries } from './searchCountries';

const fetchMock = vi.fn();

describe('searchCountries', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test.each([
        { desc: 'no arguments passed', args: [] },
        { desc: 'query is not a string', args: [1, new AbortController().signal] },
        { desc: 'signal is not an AbortSignal', args: ['Japan', '100'] },
    ])('should throw InvalidArgumentsError when $desc', ({ args }) => {
        // @ts-expect-error — intentionally passing invalid arguments
        expect(() => searchCountries(...args)).toThrow(InvalidArgumentsError);
    });

    test('should pass the query and signal to fetch and return countries', async () => {
        const countries = [{ name: 'Japan', alpha2Code: 'JP' }];
        const signal = new AbortController().signal;
        fetchMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(countries),
        });

        await expect(searchCountries('Japan', signal)).resolves.toEqual(countries);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('Japan'),
            expect.objectContaining({ signal }),
        );
    });

    test.each([404, 500])('should reject when the response status is %i', async (status) => {
        fetchMock.mockResolvedValue({
            ok: false,
            status,
            json: vi.fn().mockResolvedValue({ message: 'Request failed' }),
        });

        await expect(
            searchCountries('Japan', new AbortController().signal),
        ).rejects.toThrow();
    });
});
