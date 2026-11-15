import { AbortError, HttpError, InvalidArgumentsError, TimeoutError } from '../errors/errors';
import type { Country } from '../models/models';

function getErrorDetails(error: unknown): { name: string; message: string } | undefined {
    if (typeof error !== 'object' || error === null || !('name' in error) || typeof error.name !== 'string') {
        return undefined;
    }

    return {
        name: error.name,
        message: 'message' in error && typeof error.message === 'string' ? error.message : '',
    };
}

function normalizeRequestError(error: unknown, signal: AbortSignal): unknown {
    const namedError = getErrorDetails(signal.reason) ?? getErrorDetails(error);

    if (namedError?.name === 'TimeoutError') {
        return new TimeoutError(namedError.message);
    }
    if (namedError?.name === 'AbortError') {
        return new AbortError(namedError.message);
    }

    return error;
}

export function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
    if (typeof query !== 'string' || !(signal instanceof AbortSignal)) {
        throw new InvalidArgumentsError();
    }

    const url = `https://countries.dev/name/${encodeURIComponent(query)}`;

    return fetch(url, { signal })
        .then((response) => {
            if (response.status === 404) {
                return [];
            }

            if (!response.ok) {
                throw new HttpError(response.status);
            }

            return response.json() as Promise<Country[]>;
        })
        .catch((error: unknown) => {
            throw normalizeRequestError(error, signal);
        });
}
