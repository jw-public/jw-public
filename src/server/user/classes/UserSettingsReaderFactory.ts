import { I18nProvider } from '../../../imports/i18n/classes/I18nProvider';
import { II18nProvider } from '../../../imports/i18n/interfaces/II18nProvider';
import { Types } from "../../Types";

import { IUserSettingsReader } from "../interfaces/IUserSettingsReader";
import { IUserSettingsReaderFactory } from "../interfaces/IUserSettingsReaderFactory";

import { inject, injectable, named } from "inversify";
import { UserDAO } from "../../../collections/lib/UserCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";

@injectable()
export class UserSettingsReaderFactory implements IUserSettingsReaderFactory {


  constructor(
    @inject(Types.Collection) @named("user") private users: SimpleCollection<UserDAO>) {
  }

  createSettingsReaderFor(userId: string): IUserSettingsReader {
    return new UserSettingsReader(userId, this.users);
  }

}

class UserSettingsReader implements IUserSettingsReader {
  private user: UserDAO;

  constructor(
    private userId: string,
    private users: SimpleCollection<UserDAO>) {
    this.user = this.users.findOne({ _id: this.userId });
  }

  public wantsToReceiveNotificationAsEmail() {
    let wantsToReceiveNotificationAsEmail = this.user.profile.notificationAsEmail
    return wantsToReceiveNotificationAsEmail === undefined || wantsToReceiveNotificationAsEmail;
  }

  public getI18nProvider(): II18nProvider {
    return new I18nProvider(this.user.profile.language, "Europe/Berlin");
  }



}
