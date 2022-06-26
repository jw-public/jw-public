import * as moment from 'moment-timezone';
import { IDateParser } from '../interfaces/IDateParser';
import { II18nProvider } from '../interfaces/II18nProvider';
import { ILocale } from '../interfaces/ILocale';
import { messages as de } from '../locales/de';
import { messages as en } from '../locales/en';
import { messages as fr } from '../locales/fr';

export type Locale =
    "de-de"
    | "en-en"
    | "fr-fr";

export type Timezone =
    "Europe/Berlin";

export const SUPPORTED_LANGUAGES: Locale[] = ["de-de", "en-en", "fr-fr"];

export class I18nProvider implements II18nProvider {


    private i18n: ILocale = null;
    private moment: moment.Moment;

    constructor(private locale: Locale, private timezone: Timezone) {

        // Load Module and Instantiate
        if (locale == "en-en") {
            this.i18n = en;
        } else if (locale == "fr-fr") {
            this.i18n = fr;
        } else {
            this.i18n = de;
        }


    }


    getLanguageIdentifier(): Locale {
        return this.locale
    }

    public getI18n(): ILocale {
        return this.i18n;
    }

    public getDateParser(): IDateParser {
        return new SimpleDateParser(this.locale, this.i18n, this.timezone);
    }
}

class SimpleDateParser implements IDateParser {

    constructor(private locale: Locale, private localeObject: ILocale, private timezone: Timezone) {
    }

    private parseDate(date: Date | moment.Moment): moment.Moment {
        let parsed = moment(date);
        return parsed.tz(this.timezone).locale(this.locale)
    }

    public getShortDateTimeAsString(date: Date): string {
        return this.parseDate(date).format(this.localeObject.dateFormats.shortDateTime);
    }

    public getLongDateTimeAsString(date: Date): string {
        return this.parseDate(date).format(this.localeObject.dateFormats.longDateTime);
    }
}