import type { Country, MappedCountry } from '../models/models';
import debounce from './debounce';
import { mapCountryResponse } from './mapCountryResponse';
import { searchCountries } from './searchCountries';

const DEBOUNCE_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 10_000;

interface InFlightSearch {
    controller: AbortController;
    promise: Promise<Country[]>;
    subscribers: number;
}

const responseCache = new Map<string, Country[]>();
const inFlightSearches = new Map<string, InFlightSearch>();

function isAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function getAbortReason(signal: AbortSignal): unknown {
    return signal.reason ?? new DOMException('The request was aborted.', 'AbortError');
}

function createInFlightSearch(query: string): InFlightSearch {
    const controller = new AbortController();
    const requestSignal = AbortSignal.any([controller.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);

    const promise = Promise.resolve()
        .then(() => searchCountries(query, requestSignal))
        .then((countries) => {
            responseCache.set(query, countries);
            return countries;
        });

    const request = { controller, promise, subscribers: 0 };
    inFlightSearches.set(query, request);

    const removeCompletedRequest = (): void => {
        if (inFlightSearches.get(query) === request) {
            inFlightSearches.delete(query);
        }
    };
    void promise.then(removeCompletedRequest, removeCompletedRequest);

    return request;
}

function subscribeToSearch(query: string, request: InFlightSearch, signal: AbortSignal): Promise<Country[]> {
    if (signal.aborted) {
        return Promise.reject(getAbortReason(signal));
    }

    request.subscribers += 1;

    return new Promise((resolve, reject) => {
        let settled = false;

        const detach = (): void => {
            signal.removeEventListener('abort', onAbort);
            request.subscribers -= 1;
        };

        const onAbort = (): void => {
            if (settled) return;

            settled = true;
            detach();
            reject(getAbortReason(signal));

            if (request.subscribers === 0 && inFlightSearches.get(query) === request) {
                inFlightSearches.delete(query);
                request.controller.abort();
            }
        };

        signal.addEventListener('abort', onAbort, { once: true });

        request.promise.then(
            (countries) => {
                if (settled) return;

                settled = true;
                detach();
                resolve(countries);
            },
            (error: unknown) => {
                if (settled) return;

                settled = true;
                detach();
                reject(error);
            }
        );
    });
}

function getCountries(query: string, signal: AbortSignal): Promise<Country[]> {
    if (signal.aborted) {
        return Promise.reject(getAbortReason(signal));
    }

    const cachedCountries = responseCache.get(query);
    if (cachedCountries !== undefined) {
        return Promise.resolve(cachedCountries);
    }

    const request = inFlightSearches.get(query) ?? createInFlightSearch(query);
    return subscribeToSearch(query, request, signal);
}

export function createCountrySearch(
    onResults: (countries: MappedCountry[]) => void,
    onError: (error: unknown) => void,
    onLoading: () => void = () => {}
): (query: string) => void {
    let activeController: AbortController | undefined;
    let activeQuery: string | undefined;

    const debouncedSearch = debounce((query: string, controller: AbortController) => {
        void getCountries(query, controller.signal)
            .then((countries) => countries.map(mapCountryResponse))
            .then((countries) => {
                if (!controller.signal.aborted) {
                    onResults(countries);
                }
            })
            .catch((error: unknown) => {
                if (activeController === controller) {
                    activeController = undefined;
                    activeQuery = undefined;
                }

                if (!controller.signal.aborted && !isAbortError(error)) {
                    onError(error);
                }
            })
            .finally(() => {
                if (activeController === controller) {
                    activeController = undefined;
                    activeQuery = undefined;
                }
            });
    }, DEBOUNCE_DELAY_MS);

    function search(query: string): void {
        const normalizedQuery = query.trim();

        if (
            normalizedQuery !== '' &&
            normalizedQuery === activeQuery &&
            activeController !== undefined &&
            !activeController.signal.aborted
        ) {
            return;
        }

        activeController?.abort();
        activeController = undefined;
        activeQuery = undefined;

        if (!normalizedQuery) {
            debouncedSearch.cancel();
            return;
        }

        const controller = new AbortController();
        activeController = controller;
        activeQuery = normalizedQuery;
        onLoading();
        debouncedSearch(normalizedQuery, controller);
    }

    return search;
}
