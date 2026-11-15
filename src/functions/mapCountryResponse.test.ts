import { describe, expect, test } from 'vitest';
import type { Country } from '../models/models';
import { mapCountryResponse } from './mapCountryResponse';

describe('mapCountryResponse', () => {
    test('maps fields used by the app and omits unused API fields', () => {
        const raw: Country = {
            name: 'Japan',
            topLevelDomain: ['.jp'],
            alpha2Code: 'JP',
            alpha3Code: 'JPN',
            callingCodes: ['81'],
            capital: 'Tokyo',
            altSpellings: ['Nippon'],
            subregion: 'Eastern Asia',
            region: 'Asia',
            population: 123_000_000,
            latlng: [36.2, 138.2],
            demonym: 'Japanese',
            area: 377_975,
            timezones: ['UTC+09:00'],
            borders: [],
            nativeName: '日本',
            numericCode: '392',
            flags: { svg: 'japan.svg', png: 'japan.png' },
            currencies: [{ code: 'JPY', name: 'Japanese yen', symbol: '¥' }],
            languages: [
                {
                    iso639_1: 'ja',
                    iso639_2: 'jpn',
                    name: 'Japanese',
                    nativeName: '日本語',
                },
            ],
            flag: '🇯🇵',
            maps: {
                googleMaps: 'https://maps.example/japan',
                openStreetMaps: 'https://osm.example/japan',
            },
            populationDensity: 326.2,
        };

        expect(mapCountryResponse(raw)).toEqual({
            name: 'Japan',
            topLevelDomain: ['.jp'],
            alpha2Code: 'JP',
            alpha3Code: 'JPN',
            callingCodes: ['81'],
            capital: 'Tokyo',
            subregion: 'Eastern Asia',
            region: 'Asia',
            population: 123_000_000,
            latlng: [36.2, 138.2],
            demonym: 'Japanese',
            area: 377_975,
            timezones: ['UTC+09:00'],
            borders: [],
            nativeName: '日本',
            numericCode: '392',
            currencies: [{ code: 'JPY', name: 'Japanese yen', symbol: '¥' }],
            languages: [
                {
                    iso639_1: 'ja',
                    iso639_2: 'jpn',
                    name: 'Japanese',
                    nativeName: '日本語',
                },
            ],
            flag: '🇯🇵',
            populationDensity: 326.2,
        });
    });
});
