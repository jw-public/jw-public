import {IEmailSender, IEmailSendOptions} from "../../server/mailing/interfaces/IEmailSender";
import { injectable, inject, Kernel, interfaces } from "inversify";

/** Does nothing **/
injectable()
export class NullEmailSender implements IEmailSender {

  public send(options: IEmailSendOptions) {

  }

}
