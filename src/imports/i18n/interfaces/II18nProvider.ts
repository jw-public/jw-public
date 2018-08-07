import { Locale } from '../classes/I18nProvider';
import { IDateParser } from './IDateParser';
import { ILocale } from './ILocale';
export interface II18nProvider {
    getI18n(): ILocale
    getDateParser(): IDateParser
    getLanguageIdentifier(): Locale
}