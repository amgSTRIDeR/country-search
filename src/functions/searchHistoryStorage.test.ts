import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getSearchHistory, saveSearchQuery } from './searchHistoryStorage';

const storedValues = new Map<string, string>();

describe('search history storage', () => {
    beforeEach(() => {
        storedValues.clear();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => storedValues.get(key) ?? null,
            setItem: (key: string, value: string) => storedValues.set(key, value),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('persists recent unique queries and returns them for rendering', () => {
        expect(saveSearchQuery(' Japan ')).toEqual(['Japan']);
        expect(saveSearchQuery('Canada')).toEqual(['Canada', 'Japan']);
        expect(saveSearchQuery('Japan')).toEqual(['Japan', 'Canada']);
        expect(getSearchHistory()).toEqual(['Japan', 'Canada']);
    });

    test('keeps only the 12 most recent queries', () => {
        for (let index = 0; index < 13; index += 1) {
            saveSearchQuery(`Country ${index}`);
        }

        expect(getSearchHistory()).toHaveLength(12);
        expect(getSearchHistory()[0]).toBe('Country 12');
        expect(getSearchHistory()[11]).toBe('Country 1');
    });
});
