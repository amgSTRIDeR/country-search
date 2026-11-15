import './styles.scss';
import { createCountrySearch } from './functions/createCountrySearch';
import { getCountryResults, saveCountryResults } from './functions/countryResultsStorage';
import { getSearchHistory, saveSearchQuery } from './functions/searchHistoryStorage';

export type Debounced<T extends (...args: never[]) => unknown> = ((...args: Parameters<T>) => void) & {
    cancel: () => void;
};

export interface CountryFlags {
    svg: string;
    png: string;
}
export interface CountryCurrency {
    code: string;
    name: string;
    symbol: string;
}
export interface CountryLanguage {
    iso639_1: string;
    iso639_2: string;
    name: string;
    nativeName: string;
}
export interface CountryMaps {
    googleMaps: string;
    openStreetMaps: string;
}
export interface Country {
    name: string;
    topLevelDomain: string[];
    alpha2Code: string;
    alpha3Code: string;
    callingCodes: string[];
    capital: string;
    altSpellings: string[];
    subregion: string;
    region: string;
    population: number;
    latlng: [number, number];
    demonym: string;
    area: number;
    timezones: string[];
    borders: string[];
    nativeName: string;
    numericCode: string;
    flags: CountryFlags;
    currencies: CountryCurrency[];
    languages: CountryLanguage[];
    flag: string;
    maps: CountryMaps;
    populationDensity: number;
}
export type Countries = Country[];
export type MappedCountry = Pick<
    Country,
    | 'name'
    | 'topLevelDomain'
    | 'alpha2Code'
    | 'alpha3Code'
    | 'callingCodes'
    | 'capital'
    | 'subregion'
    | 'region'
    | 'population'
    | 'latlng'
    | 'demonym'
    | 'area'
    | 'timezones'
    | 'borders'
    | 'nativeName'
    | 'numericCode'
    | 'currencies'
    | 'languages'
    | 'flag'
    | 'populationDensity'
>;

type Status = 'idle' | 'results' | 'loading' | 'empty' | 'error';
type SearchHandler = (query: string) => void;

const element = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    content?: string
): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
};
const append = (parent: HTMLElement, ...nodes: HTMLElement[]): void => {
    parent.append(...nodes);
};
const number = (value: number): string => new Intl.NumberFormat('en-US').format(value);
const list = (items: string[]): string => (items.length ? items.join(', ') : '—');

let visibleCountries: MappedCountry[] = [];
let history: string[] = [];
let currentSelection: MappedCountry | null = null;
let status: Status = 'idle';
let errorMessage = 'Ошибка получения списка стран';
let onSearch: SearchHandler | null = null;

const app = element('main', 'parkan-app');
app.setAttribute('aria-label', 'Country Search / Parkan');

const terminal = element('section', 'search-panel');
terminal.setAttribute('aria-label', 'Поиск стран');
const heading = element('h1', 'terminal-heading', 'ПОИСК СТРАН');
const form = element('form', 'search-form');
const query = element('input', 'search-input');
query.type = 'search';
query.name = 'country';
query.placeholder = 'Название страны...';
query.autocomplete = 'off';
query.setAttribute('aria-label', 'Название страны');
const submit = element('button', 'search-submit', 'ПОИСК');
submit.type = 'submit';
append(form, query, submit);
const resultsHeading = element('h2', 'terminal-subheading', 'ОБНАРУЖЕННЫЕ СТРАНЫ');
const results = element('div', 'results-list');
results.setAttribute('aria-live', 'polite');
const historyHeading = element('h2', 'terminal-subheading', 'ИСТОРИЯ ПОИСКА');
const historyTrack = element('div', 'history-track');
append(terminal, heading, form, resultsHeading, results, historyHeading, historyTrack);
append(app, terminal);

const audio = new Audio();
audio.src = new URL('./assets/track.mp3', import.meta.url).href;
audio.preload = 'none';
audio.loop = true;
audio.volume = 0.48;
const player = element('section', 'sound-panel');
player.setAttribute('aria-label', 'Музыкальный плеер');
const soundTitle = element('span', 'sound-title', 'MUSIC');
const play = element('button', 'sound-play', '▶ PLAY');
play.type = 'button';
play.setAttribute('aria-pressed', 'false');
play.title = 'Включить или поставить на паузу';
const volumeTitle = element('label', 'sound-volume-label', 'VOL');
const volume = element('input', 'sound-volume');
volume.type = 'range';
volume.id = 'parkan-volume';
volume.min = '0';
volume.max = '100';
volume.step = '1';
volume.value = '48';
volumeTitle.htmlFor = volume.id;
volume.setAttribute('aria-label', 'Громкость');
volume.style.setProperty('--volume', '48%');
append(player, soundTitle, play, volumeTitle, volume);
append(app, player);

const updatePlayButton = (): void => {
    play.textContent = audio.paused ? '▶ PLAY' : 'Ⅱ PAUSE';
    play.setAttribute('aria-pressed', String(!audio.paused));
};
const playAudio = async (): Promise<void> => {
    try {
        await audio.play();
    } catch (error) {
        console.warn('Не удалось воспроизвести аудио:', error);
    }
    updatePlayButton();
};
play.addEventListener('click', () => {
    if (audio.paused) void playAudio();
    else {
        audio.pause();
        updatePlayButton();
    }
});
volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    volume.style.setProperty('--volume', `${volume.value}%`);
});
audio.addEventListener('play', updatePlayButton);
audio.addEventListener('pause', updatePlayButton);

// In-game country dossier: native modal with the existing trade terminal skin.
const dialog = element('dialog', 'country-dialog');
dialog.setAttribute('aria-label', 'Досье страны');
const modalLabel = element('h2', 'modal-heading', 'РЕЕСТР СТРАН / СВЕДЕНИЯ');
const close = element('button', 'modal-close', 'ОТМЕНА');
close.type = 'button';
close.setAttribute('aria-label', 'Закрыть');
const modalBody = element('section', 'modal-body');
const countryHeader = element('div', 'modal-country-heading');
const countryRows = element('div', 'modal-data');
append(modalBody, countryHeader, countryRows);
append(dialog, modalLabel, close, modalBody);
close.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event: MouseEvent) => {
    if (event.target === dialog) dialog.close();
});
document.body.append(app, dialog);

const countryFields = (country: MappedCountry): Array<[string, string]> => [
    ['Название', country.name],
    ['Нац. название', country.nativeName],
    ['Столица', country.capital],
    ['Регион', country.region],
    ['Субрегион', country.subregion],
    ['Население', number(country.population)],
    ['Площадь', `${number(country.area)} км²`],
    ['Плотность', `${number(country.populationDensity)} чел./км²`],
    ['Народность', country.demonym],
    ['Код α-2', country.alpha2Code],
    ['Код α-3', country.alpha3Code],
    ['Числовой код', country.numericCode],
    ['Домены', list(country.topLevelDomain)],
    ['Телефон', list(country.callingCodes.map((code) => `+${code}`))],
    ['Валюты', list(country.currencies.map((currency) => `${currency.code} · ${currency.name} (${currency.symbol})`))],
    ['Языки', list(country.languages.map((language) => `${language.name} (${language.nativeName})`))],
    ['Часовые пояса', list(country.timezones)],
    ['Границы', list(country.borders)],
    ['Координаты', `${country.latlng[0]}°, ${country.latlng[1]}°`],
];

const buttonForCountry = (country: MappedCountry): HTMLButtonElement => {
    const button = element('button', 'result-item');
    button.type = 'button';
    button.title = `Открыть сведения: ${country.name}`;
    if (country.alpha3Code === currentSelection?.alpha3Code) button.classList.add('selected');
    const flag = element('span', 'country-flag', country.flag);
    flag.setAttribute('aria-hidden', 'true');
    const countryName = element('span', 'country-name', country.name);
    append(button, flag, countryName);
    append(button, element('span', 'country-region', country.region));
    button.addEventListener('click', () => openCountry(country));
    return button;
};

function renderHistory(): void {
    historyTrack.replaceChildren();
    if (!history.length) {
        append(historyTrack, element('span', 'history-empty', 'Запросов пока нет'));
        return;
    }
    for (const term of history) historyTrack.append(buttonForHistoryQuery(term));
}

function buttonForHistoryQuery(term: string): HTMLButtonElement {
    const button = element('button', 'history-item');
    button.type = 'button';
    button.title = `Повторить поиск: ${term}`;
    append(button, element('span', 'country-name', term));
    button.addEventListener('click', () => {
        query.value = term;
        submitSearch();
    });
    return button;
}

function renderResults(): void {
    results.replaceChildren();
    if (status === 'idle') {
        append(results, element('p', 'result-state', 'Введите название страны'));
    } else if (status === 'loading') {
        append(results, element('p', 'result-state', 'Загрузка стран...'));
    } else if (status === 'error') {
        append(results, element('p', 'result-state error-state', errorMessage));
        const retry = element('button', 'retry-button', 'ПОВТОРИТЬ');
        retry.type = 'button';
        retry.addEventListener('click', () => submitSearch());
        append(results, retry);
    } else if (status === 'empty' || !visibleCountries.length) {
        append(results, element('p', 'result-state', 'Страны не найдены'));
    } else {
        for (const country of visibleCountries) results.append(buttonForCountry(country));
    }
}

function openCountry(country: MappedCountry): void {
    currentSelection = country;
    countryHeader.replaceChildren();
    const flag = element('span', 'modal-flag', country.flag);
    const name = element('span', 'modal-country-name', `${country.name} / ${country.alpha3Code}`);
    append(countryHeader, flag, name);
    countryRows.replaceChildren();
    for (const [label, value] of countryFields(country)) {
        const row = element('div', 'modal-row');
        append(row, element('span', 'modal-key', label), element('span', 'modal-value', value));
        append(countryRows, row);
    }
    renderHistory();
    renderResults();
    if (!dialog.open) dialog.showModal();
}

function submitSearch(): void {
    const term = query.value.trim();
    if (!term) {
        visibleCountries = [];
        status = 'idle';
        renderResults();
        onSearch?.('');
        return;
    }
    onSearch?.(term);
}
form.addEventListener('submit', (event: SubmitEvent) => {
    event.preventDefault();
    submitSearch();
});
query.addEventListener('input', submitSearch);

// Minimal view hooks for the user's separate country-search logic.
export const setResults = (next: MappedCountry[]): void => {
    saveCountryResults(next);
    visibleCountries = next;
    status = next.length ? 'results' : 'empty';
    renderResults();
};
export const setLoading = (): void => {
    status = 'loading';
    renderResults();
};
export const setEmpty = (): void => {
    status = 'empty';
    visibleCountries = [];
    renderResults();
};
export const setError = (message = 'Ошибка получения списка стран'): void => {
    errorMessage = message;
    status = 'error';
    renderResults();
};
export const setHistory = (items: string[]): void => {
    history = items.slice(0, 12);
    renderHistory();
};
export const setSearchHandler = (handler: SearchHandler): void => {
    onSearch = handler;
};
export const setAudioSource = (url: string): void => {
    audio.pause();
    audio.src = url;
    updatePlayButton();
};

try {
    visibleCountries = getCountryResults();
    status = visibleCountries.length ? 'results' : 'idle';
    history = getSearchHistory();
} catch (error) {
    setError(error instanceof Error ? error.message : 'Ошибка загрузки сохранённых данных');
}

setSearchHandler(
    createCountrySearch(
        setResults,
        (error) => setError(error instanceof Error ? error.message : 'Ошибка поиска стран'),
        setLoading,
        (term) => {
            history = saveSearchQuery(term);
            renderHistory();
        }
    )
);

renderResults();
renderHistory();
