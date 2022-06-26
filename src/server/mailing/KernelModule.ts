
import { interfaces, KernelModule } from "inversify";


import { MailingTypes } from "./MailingTypes";


import { UserMailer } from "./classes/UserMailer";
import { IUserMailer } from "./interfaces/IUserMailer";



export const kernelModule = new KernelModule((bind: interfaces.Bind) => {

  bind<IUserMailer>(MailingTypes.IUserMailer).to(UserMailer);

});
