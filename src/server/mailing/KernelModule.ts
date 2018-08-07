
import { KernelModule, interfaces } from "inversify";


import {Types} from "../Types";
import {MailingTypes} from "./MailingTypes";

import {SimpleCollection} from "../../imports/interfaces/SimpleCollection";

import {IUserMailer} from "./interfaces/IUserMailer";
import {UserMailer} from "./classes/UserMailer";



export const kernelModule = new KernelModule((bind: interfaces.Bind) => {

  bind<IUserMailer>(MailingTypes.IUserMailer).to(UserMailer);

});
