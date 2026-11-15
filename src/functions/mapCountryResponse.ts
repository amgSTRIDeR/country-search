import type { Country, MappedCountry } from '../models/models';

export function mapCountryResponse(raw: Country): MappedCountry {
    const {
        name,
        topLevelDomain = [],
        alpha2Code,
        alpha3Code,
        callingCodes = [],
        capital,
        subregion,
        region,
        population,
        latlng,
        demonym,
        area,
        timezones = [],
        borders = [],
        nativeName,
        numericCode,
        currencies = [],
        languages = [],
        flag,
        populationDensity,
    } = raw;

    return {
        name,
        topLevelDomain: topLevelDomain ?? [],
        alpha2Code,
        alpha3Code,
        callingCodes: callingCodes ?? [],
        capital,
        subregion,
        region,
        population,
        latlng,
        demonym,
        area,
        timezones: timezones ?? [],
        borders: borders ?? [],
        nativeName,
        numericCode,
        currencies: currencies ?? [],
        languages: languages ?? [],
        flag,
        populationDensity,
    };
}
