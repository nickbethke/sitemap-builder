import {de} from '@/lib/i18n/de.ts';
import {en} from '@/lib/i18n/en.ts';

export type Locale = 'de' | 'en';

export const LOCALES: {id: Locale; label: string}[] = [
    {id: 'de', label: 'Deutsch'},
    {id: 'en', label: 'English'},
];

export const DEFAULT_LOCALE: Locale = 'de';

type Dict = Record<string, string>;

export const translations: Record<Locale, Dict> = {de, en};
