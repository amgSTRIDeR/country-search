import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Country, MappedCountry } from '../models/models';
import { createCountrySearch } from './createCountrySearch';

interface PendingRequest {
    signal: AbortSignal;
    resolve: (country: Country) => void;
}

const pendingRequests = new Map<string, PendingRequest>();
const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function country(name: string): Country {
    return {
        name,
        topLevelDomain: [],
        alpha2Code: 'XX',
        alpha3Code: 'XXX',
        callingCodes: [],
        capital: '',
        altSpellings: [],
        subregion: '',
        region: '',
        population: 0,
        latlng: [0, 0],
        demonym: '',
        area: 0,
        timezones: [],
        borders: [],
        nativeName: name,
        numericCode: '',
        flags: { svg: '', png: '' },
        currencies: [],
        languages: [],
        flag: 'flag',
        maps: { googleMaps: '', openStreetMaps: '' },
        populationDensity: 0,
    };
}

describe('createCountrySearch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        pendingRequests.clear();
        fetchMock.mockReset();
        fetchMock.mockImplementation((input, init) => {
            const term = decodeURIComponent(new URL(String(input)).pathname.split('/').pop() ?? '');
            const signal = init?.signal;
            if (!signal) {
                return Promise.reject(new Error('Expected an abort signal'));
            }

            return new Promise<Response>((resolve, reject) => {
                let settled = false;
                const cleanUp = (): void => signal.removeEventListener('abort', onAbort);
                const onAbort = (): void => {
                    if (settled) return;
                    settled = true;
                    cleanUp();
                    reject(new DOMException('The request was aborted', 'AbortError'));
                };

                signal.addEventListener('abort', onAbort, { once: true });
                pendingRequests.set(term, {
                    signal,
                    resolve: (result) => {
                        if (settled) return;
                        settled = true;
                        cleanUp();
                        resolve({
                            ok: true,
                            status: 200,
                            json: async () => [result],
                        } as Response);
                    },
                });
            });
        });
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    test('aborts an outdated request and only returns the latest query result', async () => {
        let displayedCountries: MappedCountry[] = [];
        let resolveLatestResults!: (countries: MappedCountry[]) => void;
        const latestResults = new Promise<MappedCountry[]>((resolve) => {
            resolveLatestResults = resolve;
        });
        const onResults = vi.fn((countries: MappedCountry[]) => {
            displayedCountries = countries;
            resolveLatestResults(countries);
        });
        const onError = vi.fn();
        const search = createCountrySearch(onResults, onError);

        search('older');
        await vi.advanceTimersByTimeAsync(300);
        const outdatedRequest = pendingRequests.get('older');
        expect(outdatedRequest).toBeDefined();
        if (!outdatedRequest) {
            throw new Error('The outdated request was not sent');
        }

        search('latest');
        expect(outdatedRequest.signal.aborted).toBe(true);

        await vi.advanceTimersByTimeAsync(300);
        const latestRequest = pendingRequests.get('latest');
        expect(latestRequest).toBeDefined();
        if (!latestRequest) {
            throw new Error('The latest request was not sent');
        }
        latestRequest.resolve(country('Latest'));

        await latestResults;
        await vi.advanceTimersByTimeAsync(0);

        expect(displayedCountries.map(({ name }) => name)).toEqual(['Latest']);
        expect(onResults).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });
});
