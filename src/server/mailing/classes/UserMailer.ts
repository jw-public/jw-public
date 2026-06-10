import { Logger } from '../../../imports/logging/Logger';
import { LoggerFactory } from '../../../imports/logging/LoggerFactory';
import { Types } from "../../Types";
import { UserTypes } from "../../user/UserTypes";
import { MailingTypes } from "../MailingTypes";

import { IEmailSender } from "../interfaces/IEmailSender";
import { IUserMailer, IUserMailerOptions } from "../interfaces/IUserMailer";

import { IUserFactory } from "../../user/interfaces/IUserFactory";

import { marked } from 'marked';
import * as removeMarkdown from 'remove-markdown';

export class UserMailer implements IUserMailer {
  private logger: Logger;


  constructor(private mailSender: IEmailSender,
    private userFactory: IUserFactory,
    loggerFactory: LoggerFactory,
  ) {

    if (loggerFactory) {
      this.logger = loggerFactory.createLogger("UserMailer");
    }

  }


  public async send(options: IUserMailerOptions): Promise<void> {
    let user = await this.userFactory.createUser(options.recepientId);

    if (!user.exists()) {
      return;
    }

    let userEmail = user.getEmailAddress();

    this.logger.info("Sending mail to " + userEmail);


    let senderEmail = "'PublicAssistant' <no-reply@jw-public.org>";
    let replyTo = senderEmail;
    if (options.replyToAddress && options.replyToAddress.includes("@")) {
      replyTo = options.replyToAddress;
    }

    this.mailSender.send({
      replyTo: replyTo,
      from: senderEmail,
      to: userEmail,
      subject: options.subject,
      text: removeMarkdown(options.markdownContent),
      html: marked.parse(options.markdownContent) as string
    });
  }

}
