import type { Country } from "..";
import { HttpError, InvalidArgumentsError } from '../errors/errors';

export function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
    if (typeof query !== 'string' || !(signal instanceof AbortSignal)) {
        throw new InvalidArgumentsError();
    }

    const url = `https://countries.dev/name/${encodeURIComponent(query)}`;

    return fetch(url, { signal }).then((response) => {
        if (response.status === 404) {
            return [];
        }

        if (!response.ok) {
            throw new HttpError(response.status);
        }

        return response.json() as Promise<Country[]>;
    });
}