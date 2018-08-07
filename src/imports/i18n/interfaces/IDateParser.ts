export interface IDateParser {
    getShortDateTimeAsString(date: Date): string
    getLongDateTimeAsString(date: Date): string
}