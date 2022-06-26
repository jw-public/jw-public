import { IUserSettingsReader } from "./IUserSettingsReader";

export interface IUserSettingsReaderFactory {
  createSettingsReaderFor(userId: string): IUserSettingsReader;
}
