import { interfaces, KernelModule } from "inversify";


import { MailingTypes } from "./MailingTypes";


import { Email } from "meteor/email";
import { IEmailSender } from "./interfaces/IEmailSender";


export const meteorSpecificBindings = new KernelModule((bind: interfaces.Bind) => {
  bind<IEmailSender>(MailingTypes.IEmailSender).toConstantValue(Email);
});
