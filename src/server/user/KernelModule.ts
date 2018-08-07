
import { KernelModule, interfaces } from "inversify";


import {Types} from "../Types";
import {UserTypes} from "./UserTypes";

import {SimpleCollection} from "../../imports/interfaces/SimpleCollection";

import {IUserFactory} from "./interfaces/IUserFactory";
import {UserFactory} from "./classes/UserFactory";

import {IUserSettingsReaderFactory} from "./interfaces/IUserSettingsReaderFactory";
import {UserSettingsReaderFactory} from "./classes/UserSettingsReaderFactory";


export const kernelModule = new KernelModule((bind: interfaces.Bind) => {

  bind<IUserFactory>(UserTypes.IUserFactory).to(UserFactory);
  bind<IUserSettingsReaderFactory>(UserTypes.IUserSettingsReaderFactory).to(UserSettingsReaderFactory);

});
