import { I18nProvider } from '../../../imports/i18n/classes/I18nProvider';
import { II18nProvider } from '../../../imports/i18n/interfaces/II18nProvider';
import { Types } from "../../Types";

import { IUserSettingsReader } from "../interfaces/IUserSettingsReader";
import { IUserSettingsReaderFactory } from "../interfaces/IUserSettingsReaderFactory";

import { UserDAO } from "../../../collections/lib/UserCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";

export class UserSettingsReaderFactory implements IUserSettingsReaderFactory {


  constructor(
    private users: SimpleCollection<UserDAO>) {
  }

  async createSettingsReaderFor(userId: string): Promise<IUserSettingsReader> {
    const user = await this.users.findOneAsync({ _id: userId });
    return new UserSettingsReader(user);
  }

}

class UserSettingsReader implements IUserSettingsReader {

  constructor(private user: UserDAO) {
  }

  public wantsToReceiveNotificationAsEmail() {
    let wantsToReceiveNotificationAsEmail = this.user.profile.notificationAsEmail
    return wantsToReceiveNotificationAsEmail === undefined || wantsToReceiveNotificationAsEmail;
  }

  public getI18nProvider(): II18nProvider {
    return new I18nProvider(this.user.profile.language, "Europe/Berlin");
  }



}
