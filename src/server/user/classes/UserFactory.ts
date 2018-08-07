import { Types } from "../../Types";
import { UserTypes } from "../UserTypes";

import { IUserFactory } from "../interfaces/IUserFactory";
import { IUserBE } from "../interfaces/IUserBE";

import { injectable, inject, named } from "inversify";
import { SimpleCollection } from "../../../imports/interfaces/SimpleCollection";
import { UserDAO } from "../../../collections/lib/UserCollection";

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
