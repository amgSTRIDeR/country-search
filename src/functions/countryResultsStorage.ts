import type { MappedCountry } from '../models/models';

const STORAGE_KEY = 'country-search-results';

type StoredObject = Record<string, unknown>;

function isStoredObject(value: unknown): value is StoredObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isLatLng(value: unknown): value is [number, number] {
    if (!Array.isArray(value) || value.length !== 2) {
        return false;
    }

    return isNumber(value[0]) && isNumber(value[1]);
}

function isCurrency(value: unknown): value is MappedCountry['currencies'][number] {
    return (
        isStoredObject(value) &&
        typeof value.code === 'string' &&
        typeof value.name === 'string' &&
        typeof value.symbol === 'string'
    );
}

function isLanguage(value: unknown): value is MappedCountry['languages'][number] {
    return (
        isStoredObject(value) &&
        typeof value.iso639_1 === 'string' &&
        typeof value.iso639_2 === 'string' &&
        typeof value.name === 'string' &&
        typeof value.nativeName === 'string'
    );
}

function isMappedCountry(value: unknown): value is MappedCountry {
    return (
        isStoredObject(value) &&
        typeof value.name === 'string' &&
        isStringArray(value.topLevelDomain) &&
        typeof value.alpha2Code === 'string' &&
        typeof value.alpha3Code === 'string' &&
        isStringArray(value.callingCodes) &&
        typeof value.capital === 'string' &&
        typeof value.subregion === 'string' &&
        typeof value.region === 'string' &&
        isNumber(value.population) &&
        isLatLng(value.latlng) &&
        typeof value.demonym === 'string' &&
        isNumber(value.area) &&
        isStringArray(value.timezones) &&
        isStringArray(value.borders) &&
        typeof value.nativeName === 'string' &&
        typeof value.numericCode === 'string' &&
        Array.isArray(value.currencies) &&
        value.currencies.every(isCurrency) &&
        Array.isArray(value.languages) &&
        value.languages.every(isLanguage) &&
        typeof value.flag === 'string' &&
        isNumber(value.populationDensity)
    );
}

function isMappedCountryArray(value: unknown): value is MappedCountry[] {
    return Array.isArray(value) && value.every(isMappedCountry);
}

export function saveCountryResults(results: MappedCountry[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function getCountryResults(): MappedCountry[] {
    const storedResults = localStorage.getItem(STORAGE_KEY);
    if (storedResults === null) {
        return [];
    }

    const parsedResults: unknown = JSON.parse(storedResults);
    if (!isMappedCountryArray(parsedResults)) {
        throw new TypeError('Stored country results have an invalid format');
    }

    return parsedResults;
}
