import { injectable } from "inversify";
import { IEmailSender, IEmailSendOptions } from "../../server/mailing/interfaces/IEmailSender";

/** Does nothing **/
injectable()
export class NullEmailSender implements IEmailSender {

  public send(options: IEmailSendOptions) {

  }

}
