import { IUserBE } from "./IUserBE";

/** I provide fresh instances of users */

export interface IUserFactory {
  createUser(userId: string): IUserBE;
}
