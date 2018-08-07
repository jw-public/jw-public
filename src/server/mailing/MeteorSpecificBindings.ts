import { KernelModule, interfaces } from "inversify";


import {Types} from "../Types";
import {MailingTypes} from "./MailingTypes";

import {SimpleCollection} from "../../imports/interfaces/SimpleCollection";

import {IEmailSender} from "./interfaces/IEmailSender";
import {Email} from "meteor/email";


export const meteorSpecificBindings = new KernelModule((bind: interfaces.Bind) => {
  bind<IEmailSender>(MailingTypes.IEmailSender).toConstantValue(Email);
});
