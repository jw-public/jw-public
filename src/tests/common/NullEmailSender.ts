import { IEmailSender, IEmailSendOptions } from "../../server/mailing/interfaces/IEmailSender";

/** Does nothing **/
export class NullEmailSender implements IEmailSender {
  public send(_options: IEmailSendOptions) {}
}
