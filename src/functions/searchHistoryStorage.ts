const STORAGE_KEY = 'country-search-history';
const MAX_HISTORY_LENGTH = 12;

function isSearchHistory(value: unknown): value is string[] {
    return (
        Array.isArray(value) && value.every((query: unknown) => typeof query === 'string' && query.trim().length > 0)
    );
}

export function getSearchHistory(): string[] {
    const storedHistory = localStorage.getItem(STORAGE_KEY);
    if (storedHistory === null) {
        return [];
    }

    const parsedHistory: unknown = JSON.parse(storedHistory);
    if (!isSearchHistory(parsedHistory)) {
        throw new TypeError('Stored search history has an invalid format');
    }

    return parsedHistory.slice(0, MAX_HISTORY_LENGTH);
}

export function saveSearchQuery(query: string): string[] {
    const normalizedQuery = query.trim();
    const history = getSearchHistory();

    if (!normalizedQuery) {
        return history;
    }

    const updatedHistory = [normalizedQuery, ...history.filter((item) => item !== normalizedQuery)].slice(
        0,
        MAX_HISTORY_LENGTH
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
}
