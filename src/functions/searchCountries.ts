import type { Country } from "..";
import { InvalidArgumentsError } from '../errors/errors';

export function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
    if (typeof query !== 'string' || !(signal instanceof AbortSignal)) {
        throw new InvalidArgumentsError();
    }

    const url = `https://countries.dev/name/${encodeURIComponent(query)}`;

    return fetch(url, { signal }).then((response) => {
        if (!response.ok) {
            throw new Error(`Country search failed with status ${response.status}`);
        }

        return response.json() as Promise<Country[]>;
    });
}