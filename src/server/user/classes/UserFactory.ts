import { Types } from "../../Types";

import { IUserBE } from "../interfaces/IUserBE";
import { IUserFactory } from "../interfaces/IUserFactory";

import { inject, injectable, named } from "inversify";
import { UserDAO } from "../../../collections/lib/UserCollection";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";

@injectable()
export class UserFactory implements IUserFactory {


  constructor(
    @inject(Types.Collection) @named("user") private users: SimpleCollection<UserDAO>) {
  }

  createUser(userId: string) {
    return new UserBE(userId, this.users);
  }

}

class UserBE implements IUserBE {
  private user: UserDAO;

  constructor(
    private userId: string,
    private users: SimpleCollection<UserDAO>) {
    this.user = this.users.findOne({ _id: this.userId });
  }

  public exists(): boolean {
    return this.user !== undefined;
  }

  public getEmailAddress(): string {
    return this.user.emails[0].address;
  }

}
