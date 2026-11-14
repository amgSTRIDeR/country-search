export type Debounced<T extends (...args: never[]) => unknown> =
  ((...args: Parameters<T>) => void) & {
    cancel: () => void;
  };

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

export type Countries = Country[];
