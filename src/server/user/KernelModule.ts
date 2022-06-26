
import { interfaces, KernelModule } from "inversify";


import { UserTypes } from "./UserTypes";


import { UserFactory } from "./classes/UserFactory";
import { IUserFactory } from "./interfaces/IUserFactory";

import { UserSettingsReaderFactory } from "./classes/UserSettingsReaderFactory";
import { IUserSettingsReaderFactory } from "./interfaces/IUserSettingsReaderFactory";


export const kernelModule = new KernelModule((bind: interfaces.Bind) => {

  bind<IUserFactory>(UserTypes.IUserFactory).to(UserFactory);
  bind<IUserSettingsReaderFactory>(UserTypes.IUserSettingsReaderFactory).to(UserSettingsReaderFactory);

});
