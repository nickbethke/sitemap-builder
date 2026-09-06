import {de, type TranslationKey} from './de.ts';
import {en} from './en.ts';

export type Locale = 'de' | 'en';

export const LOCALES: {id: Locale; label: string}[] = [
    {id: 'de', label: 'Deutsch'},
    {id: 'en', label: 'English'},
];

export const DEFAULT_LOCALE: Locale = 'de';

export type {TranslationKey} from './de.ts';

type Dict = Record<TranslationKey, string>;

export const translations: Record<Locale, Dict> = {de, en};
