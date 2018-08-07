/** I represent an user */
export interface IUserBE{
  exists(): boolean;
  getEmailAddress(): string;
}
