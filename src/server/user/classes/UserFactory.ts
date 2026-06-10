import { Types } from "../../Types";

import { IUserBE } from "../interfaces/IUserBE";
import { IUserFactory } from "../interfaces/IUserFactory";

import { UserDAO } from "../../../collections/lib/UserCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";

export class UserFactory implements IUserFactory {


  constructor(
    private users: SimpleCollection<UserDAO>) {
  }

  async createUser(userId: string): Promise<IUserBE> {
    const user = await this.users.findOneAsync({ _id: userId });
    return new UserBE(user);
  }

}

class UserBE implements IUserBE {

  constructor(private user: UserDAO) {
  }

  public exists(): boolean {
    return this.user !== undefined;
  }

  public getEmailAddress(): string {
    return this.user.emails[0].address;
  }

}
