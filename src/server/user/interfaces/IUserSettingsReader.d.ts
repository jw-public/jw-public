import { II18nProvider } from '../../../imports/i18n/interfaces/II18nProvider';
export interface IUserSettingsReader {
  wantsToReceiveNotificationAsEmail(): boolean;
  getI18nProvider(): II18nProvider
}
