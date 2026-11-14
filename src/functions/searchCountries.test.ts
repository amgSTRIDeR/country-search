import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { HttpError, InvalidArgumentsError } from '../errors/errors';
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
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('Japan'), expect.objectContaining({ signal }));
    });

    test('should return an empty array when the response status is 404', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 404,
        });

        await expect(searchCountries('Unknown', new AbortController().signal)).resolves.toEqual([]);
    });

    test.each([400, 500])('should reject with HttpError when the response status is %i', async (status) => {
        fetchMock.mockResolvedValue({
            ok: false,
            status,
        });

        const request = searchCountries('Japan', new AbortController().signal);
        await expect(request).rejects.toBeInstanceOf(HttpError);
        await expect(request).rejects.toMatchObject({ status });
    });
});
